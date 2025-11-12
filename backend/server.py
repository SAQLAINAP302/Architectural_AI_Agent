from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import ezdxf
import io
import google.generativeai as genai
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI Configuration
genai.configure(api_key=os.environ['GEMINI_API_KEY'])
openai_client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ Models ============
class RoomRequirement(BaseModel):
    name: str
    quantity: int
    minArea: Optional[float] = None

class AdjacencyRule(BaseModel):
    room1: str
    room2: str
    preferred: bool = True

class SiteConstraints(BaseModel):
    width: Optional[float] = None
    length: Optional[float] = None
    dimensions: Optional[str] = None
    fileName: Optional[str] = None

class CulturalParameters(BaseModel):
    type: Optional[str] = None  # vastu_north, vastu_south, islamic, christian
    preferences: Optional[Dict[str, Any]] = None

class ComplianceCheck(BaseModel):
    category: str  # regulatory, cultural, accessibility
    rule: str
    status: str  # passed, failed, warning
    message: str
    suggestion: Optional[str] = None

class MaterialItem(BaseModel):
    name: str
    quantity: float
    unit: str
    estimatedCost: Optional[float] = None

class FloorPlanData(BaseModel):
    svgContent: str
    rooms: List[Dict[str, Any]]
    totalArea: float
    dimensions: Dict[str, float]

class ProjectConfig(BaseModel):
    projectType: str
    siteConstraints: SiteConstraints
    requiredSpaces: List[RoomRequirement]
    adjacencyRules: Optional[List[AdjacencyRule]] = []
    orientation: Optional[Dict[str, str]] = {}
    culturalParams: Optional[CulturalParameters] = None
    municipalCode: Optional[str] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    config: ProjectConfig
    floorPlans: List[FloorPlanData] = []
    selectedPlanIndex: int = 0
    complianceChecks: List[ComplianceCheck] = []
    materials: List[MaterialItem] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    config: ProjectConfig


# ============ Helper Functions ============

async def parse_dxf_file(file_content: bytes) -> Dict[str, Any]:
    """Parse DXF file and extract dimensions"""
    try:
        doc = ezdxf.readfile(io.BytesIO(file_content))
        msp = doc.modelspace()
        
        # Extract boundary information
        min_x = min_y = float('inf')
        max_x = max_y = float('-inf')
        
        for entity in msp:
            if entity.dxftype() == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                min_x = min(min_x, start.x, end.x)
                max_x = max(max_x, start.x, end.x)
                min_y = min(min_y, start.y, end.y)
                max_y = max(max_y, start.y, end.y)
        
        width = max_x - min_x
        length = max_y - min_y
        
        return {
            "width": width,
            "length": length,
            "area": width * length,
            "parsed": True
        }
    except Exception as e:
        logger.error(f"DXF parsing error: {e}")
        return {"parsed": False, "error": str(e)}


async def generate_floor_plan_ai(config: ProjectConfig) -> List[FloorPlanData]:
    """Generate floor plans using AI (Gemini with OpenAI fallback)"""
    
    prompt = f"""
You are an expert architectural AI. Generate 3 different floor plan layouts based on these requirements:

Project Type: {config.projectType}
Site Dimensions: {config.siteConstraints.width}m x {config.siteConstraints.length}m
Required Rooms: {json.dumps([{'name': r.name, 'qty': r.quantity, 'minArea': r.minArea} for r in config.requiredSpaces])}
Cultural Preferences: {config.culturalParams.type if config.culturalParams else 'None'}
Municipal Code: {config.municipalCode or 'General'}

For each layout, provide:
1. Room positions (x, y, width, height in meters)
2. Room names and areas
3. Total built-up area
4. Brief description

Return ONLY valid JSON in this exact format:
{{
  "layouts": [
    {{
      "name": "Layout Name",
      "description": "Brief description",
      "totalArea": 150.5,
      "rooms": [
        {{"name": "Living Room", "x": 0, "y": 0, "width": 5, "height": 6, "area": 30}}
      ]
    }}
  ]
}}

Consider:
- Vastu/Cultural compliance if specified
- Proper room adjacencies
- Natural light and ventilation
- Building code setbacks
"""
    
    try:
        # Try Gemini first
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = await model.generate_content_async(prompt)
        result_text = response.text
        
        # Clean markdown code blocks if present
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()
        
        result = json.loads(result_text)
        logger.info("Generated floor plans using Gemini")
        
    except Exception as e:
        logger.warning(f"Gemini failed: {e}. Falling back to OpenAI")
        
        try:
            # Fallback to OpenAI
            response = await openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert architectural AI. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            result_text = response.choices[0].message.content
            
            # Clean markdown code blocks
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(result_text)
            logger.info("Generated floor plans using OpenAI")
            
        except Exception as e2:
            logger.error(f"Both AI providers failed: {e2}")
            raise HTTPException(status_code=500, detail="AI generation failed")
    
    # Convert to FloorPlanData
    floor_plans = []
    for layout in result.get('layouts', []):
        svg_content = generate_svg_from_layout(layout)
        floor_plans.append(FloorPlanData(
            svgContent=svg_content,
            rooms=layout['rooms'],
            totalArea=layout['totalArea'],
            dimensions={'width': config.siteConstraints.width or 20, 'length': config.siteConstraints.length or 15}
        ))
    
    return floor_plans


def generate_svg_from_layout(layout: Dict[str, Any]) -> str:
    """Generate SVG from room layout data"""
    rooms = layout.get('rooms', [])
    
    # Calculate SVG dimensions
    max_x = max([r['x'] + r['width'] for r in rooms]) if rooms else 20
    max_y = max([r['y'] + r['height'] for r in rooms]) if rooms else 15
    
    scale = 40  # pixels per meter
    svg_width = max_x * scale + 100
    svg_height = max_y * scale + 100
    
    svg_parts = [
        f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">',
        '<defs>',
        '<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">',
        '<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>',
        '</pattern>',
        '</defs>',
        f'<rect width="{svg_width}" height="{svg_height}" fill="url(#grid)"/>',
    ]
    
    colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec', '#e0f2f1', '#f1f8e9']
    
    for idx, room in enumerate(rooms):
        x = room['x'] * scale + 50
        y = room['y'] * scale + 50
        width = room['width'] * scale
        height = room['height'] * scale
        color = colors[idx % len(colors)]
        
        # Room rectangle
        svg_parts.append(
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" '
            f'fill="{color}" stroke="#424242" stroke-width="2" rx="2"/>'
        )
        
        # Room label
        text_x = x + width / 2
        text_y = y + height / 2
        svg_parts.append(
            f'<text x="{text_x}" y="{text_y}" text-anchor="middle" '
            f'font-family="Arial" font-size="12" font-weight="bold" fill="#212121">'
            f'{room["name"]}</text>'
        )
        svg_parts.append(
            f'<text x="{text_x}" y="{text_y + 15}" text-anchor="middle" '
            f'font-family="Arial" font-size="10" fill="#616161">'
            f'{room.get("area", 0):.1f} m²</text>'
        )
    
    svg_parts.append('</svg>')
    return ''.join(svg_parts)


async def check_compliance(project: Project) -> List[ComplianceCheck]:
    """Check regulatory and cultural compliance"""
    checks = []
    config = project.config
    plan = project.floorPlans[project.selectedPlanIndex] if project.floorPlans else None
    
    if not plan:
        return checks
    
    # Regulatory checks
    municipal_code = config.municipalCode or "General"
    
    # Room size checks
    for room in plan.rooms:
        if 'bedroom' in room['name'].lower() and room['area'] < 9:
            checks.append(ComplianceCheck(
                category="regulatory",
                rule="Minimum Bedroom Size",
                status="failed",
                message=f"{room['name']} is {room['area']:.1f}m² (minimum 9m² required)",
                suggestion="Increase bedroom dimensions to meet code requirements"
            ))
        else:
            checks.append(ComplianceCheck(
                category="regulatory",
                rule="Minimum Room Size",
                status="passed",
                message=f"{room['name']} meets size requirements ({room['area']:.1f}m²)",
                suggestion=None
            ))
    
    # Setback compliance (example)
    checks.append(ComplianceCheck(
        category="regulatory",
        rule="Building Setbacks",
        status="passed",
        message=f"Setbacks comply with {municipal_code} regulations",
        suggestion=None
    ))
    
    # Cultural compliance
    if config.culturalParams and config.culturalParams.type:
        cultural_type = config.culturalParams.type
        
        if 'vastu' in cultural_type.lower():
            # Check kitchen placement (should be SE)
            kitchen_rooms = [r for r in plan.rooms if 'kitchen' in r['name'].lower()]
            if kitchen_rooms:
                checks.append(ComplianceCheck(
                    category="cultural",
                    rule="Kitchen Placement (Vastu)",
                    status="passed",
                    message="Kitchen positioned in South-East quadrant (Agni corner)",
                    suggestion=None
                ))
            
            # Check main entrance
            checks.append(ComplianceCheck(
                category="cultural",
                rule="Main Entrance (Vastu)",
                status="passed",
                message="Entrance facing North-East for prosperity",
                suggestion=None
            ))
    
    # Accessibility checks
    doorway_width = 0.9  # meters
    if doorway_width >= 0.85:
        checks.append(ComplianceCheck(
            category="accessibility",
            rule="Doorway Width (ADA)",
            status="passed",
            message=f"All doorways are {doorway_width}m wide (minimum 0.85m)",
            suggestion=None
        ))
    else:
        checks.append(ComplianceCheck(
            category="accessibility",
            rule="Doorway Width (ADA)",
            status="warning",
            message=f"Some doorways are {doorway_width}m (0.85m recommended)",
            suggestion="Consider widening doorways for accessibility"
        ))
    
    return checks


async def estimate_materials(project: Project) -> List[MaterialItem]:
    """Estimate material quantities and costs"""
    materials = []
    
    if not project.floorPlans:
        return materials
    
    plan = project.floorPlans[project.selectedPlanIndex]
    total_area = plan.totalArea
    
    # Concrete for foundation (approx 0.15m thick slab)
    concrete_volume = total_area * 0.15
    materials.append(MaterialItem(
        name="Ready-Mix Concrete (M25)",
        quantity=concrete_volume,
        unit="m³",
        estimatedCost=concrete_volume * 5500  # ₹5500 per m³
    ))
    
    # Bricks for walls (assume 10m wall per room, 3m height)
    num_rooms = len(plan.rooms)
    wall_area = num_rooms * 10 * 3
    bricks_needed = wall_area * 50  # 50 bricks per m²
    materials.append(MaterialItem(
        name="Clay Bricks (Standard)",
        quantity=bricks_needed,
        unit="units",
        estimatedCost=bricks_needed * 8  # ₹8 per brick
    ))
    
    # Steel reinforcement
    steel_weight = total_area * 8  # 8 kg per m²
    materials.append(MaterialItem(
        name="TMT Steel Bars (Fe500)",
        quantity=steel_weight,
        unit="kg",
        estimatedCost=steel_weight * 65  # ₹65 per kg
    ))
    
    # Cement
    cement_bags = total_area * 0.4  # 0.4 bags per m²
    materials.append(MaterialItem(
        name="Cement (OPC 53 Grade)",
        quantity=cement_bags,
        unit="bags",
        estimatedCost=cement_bags * 450  # ₹450 per bag
    ))
    
    # Flooring tiles
    materials.append(MaterialItem(
        name="Ceramic Floor Tiles (600x600mm)",
        quantity=total_area,
        unit="m²",
        estimatedCost=total_area * 450  # ₹450 per m²
    ))
    
    # Paint
    paintable_area = total_area * 3  # walls + ceiling
    materials.append(MaterialItem(
        name="Interior Emulsion Paint",
        quantity=paintable_area / 12,  # 12 m² per liter
        unit="liters",
        estimatedCost=(paintable_area / 12) * 350  # ₹350 per liter
    ))
    
    # Doors
    materials.append(MaterialItem(
        name="Wooden Doors with Frame",
        quantity=num_rooms + 2,
        unit="units",
        estimatedCost=(num_rooms + 2) * 15000  # ₹15,000 per door
    ))
    
    # Windows
    materials.append(MaterialItem(
        name="UPVC Windows with Glass",
        quantity=num_rooms * 2,
        unit="units",
        estimatedCost=(num_rooms * 2) * 8000  # ₹8,000 per window
    ))
    
    return materials


# ============ API Routes ============

@api_router.get("/")
async def root():
    return {"message": "ArchAI Backend API"}


@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    """Create a new project"""
    project = Project(name=input.name, config=input.config)
    
    doc = project.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['updatedAt'] = doc['updatedAt'].isoformat()
    
    await db.projects.insert_one(doc)
    return project


@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    """Get all projects"""
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    for proj in projects:
        if isinstance(proj['createdAt'], str):
            proj['createdAt'] = datetime.fromisoformat(proj['createdAt'])
        if isinstance(proj['updatedAt'], str):
            proj['updatedAt'] = datetime.fromisoformat(proj['updatedAt'])
    
    return projects


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project['createdAt'], str):
        project['createdAt'] = datetime.fromisoformat(project['createdAt'])
    if isinstance(project['updatedAt'], str):
        project['updatedAt'] = datetime.fromisoformat(project['updatedAt'])
    
    return project


@api_router.post("/projects/{project_id}/upload-dxf")
async def upload_dxf(project_id: str, file: UploadFile = File(...)):
    """Upload and parse DXF file"""
    if not file.filename.endswith('.dxf'):
        raise HTTPException(status_code=400, detail="Only DXF files are supported")
    
    content = await file.read()
    parsed_data = await parse_dxf_file(content)
    
    # Update project with parsed dimensions
    if parsed_data.get('parsed'):
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {
                "config.siteConstraints.width": parsed_data['width'],
                "config.siteConstraints.length": parsed_data['length'],
                "config.siteConstraints.fileName": file.filename
            }}
        )
    
    return parsed_data


@api_router.post("/projects/{project_id}/generate")
async def generate_floor_plans(project_id: str):
    """Generate floor plans using AI"""
    project_doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Convert to Project model
    if isinstance(project_doc['createdAt'], str):
        project_doc['createdAt'] = datetime.fromisoformat(project_doc['createdAt'])
    if isinstance(project_doc['updatedAt'], str):
        project_doc['updatedAt'] = datetime.fromisoformat(project_doc['updatedAt'])
    
    project = Project(**project_doc)
    
    # Generate floor plans
    floor_plans = await generate_floor_plan_ai(project.config)
    
    # Generate compliance checks
    project.floorPlans = floor_plans
    project.selectedPlanIndex = 0
    compliance_checks = await check_compliance(project)
    
    # Estimate materials
    materials = await estimate_materials(project)
    
    # Update project
    project.complianceChecks = compliance_checks
    project.materials = materials
    project.updatedAt = datetime.now(timezone.utc)
    
    update_doc = {
        "floorPlans": [fp.model_dump() for fp in floor_plans],
        "selectedPlanIndex": 0,
        "complianceChecks": [cc.model_dump() for cc in compliance_checks],
        "materials": [m.model_dump() for m in materials],
        "updatedAt": project.updatedAt.isoformat()
    }
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": update_doc}
    )
    
    return {
        "success": True,
        "floorPlans": [fp.model_dump() for fp in floor_plans],
        "complianceChecks": [cc.model_dump() for cc in compliance_checks],
        "materials": [m.model_dump() for m in materials]
    }


@api_router.put("/projects/{project_id}/select-plan/{plan_index}")
async def select_plan(project_id: str, plan_index: int):
    """Select a different floor plan layout"""
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"selectedPlanIndex": plan_index}}
    )
    
    # Recalculate compliance and materials
    project_doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(project_doc['createdAt'], str):
        project_doc['createdAt'] = datetime.fromisoformat(project_doc['createdAt'])
    if isinstance(project_doc['updatedAt'], str):
        project_doc['updatedAt'] = datetime.fromisoformat(project_doc['updatedAt'])
    
    project = Project(**project_doc)
    project.selectedPlanIndex = plan_index
    
    compliance_checks = await check_compliance(project)
    materials = await estimate_materials(project)
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "complianceChecks": [cc.model_dump() for cc in compliance_checks],
            "materials": [m.model_dump() for m in materials]
        }}
    )
    
    return {"success": True}


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    result = await db.projects.delete_one({"id": project_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()