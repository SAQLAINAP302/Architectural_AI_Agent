import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Plus, Trash2, Loader2, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConfigurePlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [siteWidth, setSiteWidth] = useState('');
  const [siteLength, setSiteLength] = useState('');
  const [requiredSpaces, setRequiredSpaces] = useState([
    { name: 'Master Bedroom', quantity: 1, minArea: 15 }
  ]);
  const [culturalType, setCulturalType] = useState('');
  const [municipalCode, setMunicipalCode] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleAddSpace = () => {
    setRequiredSpaces([...requiredSpaces, { name: '', quantity: 1, minArea: 10 }]);
  };

  const handleRemoveSpace = (index) => {
    setRequiredSpaces(requiredSpaces.filter((_, i) => i !== index));
  };

  const handleSpaceChange = (index, field, value) => {
    const updated = [...requiredSpaces];
    updated[index][field] = value;
    setRequiredSpaces(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.dxf')) {
      toast.error('Only DXF files are supported');
      return;
    }

    setUploadedFile(file);
    toast.success('File uploaded: ' + file.name);
  };

  const handleGenerate = async () => {
    if (!projectName || !projectType || !siteWidth || !siteLength) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (requiredSpaces.some(s => !s.name)) {
      toast.error('Please fill in all room names');
      return;
    }

    setLoading(true);

    try {
      // Create project
      const projectData = {
        name: projectName,
        config: {
          projectType,
          siteConstraints: {
            width: parseFloat(siteWidth),
            length: parseFloat(siteLength),
            fileName: uploadedFile?.name
          },
          requiredSpaces: requiredSpaces.map(s => ({
            name: s.name,
            quantity: parseInt(s.quantity),
            minArea: parseFloat(s.minArea)
          })),
          culturalParams: culturalType ? {
            type: culturalType
          } : null,
          municipalCode: municipalCode || 'General'
        }
      };

      const createResponse = await axios.post(`${API}/projects`, projectData);
      const projectId = createResponse.data.id;

      // Upload DXF if provided
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        await axios.post(`${API}/projects/${projectId}/upload-dxf`, formData);
      }

      // Generate floor plans
      toast.info('Generating floor plans with AI...');
      await axios.post(`${API}/projects/${projectId}/generate`);

      toast.success('Floor plans generated successfully!');
      navigate(`/review/${projectId}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate plans');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Configure Plan Generation</h1>
            <p className="text-sm text-gray-600">Fill in the details below to generate an architectural plan.</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Name */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    data-testid="project-name-input"
                    placeholder="e.g., Modern Villa"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={['scope', 'cultural', 'municipal']} className="space-y-4">
              {/* Project Scope */}
              <AccordionItem value="scope" className="bg-white/90 backdrop-blur-sm border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Project Scope Inputs
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {/* Project Type */}
                  <div>
                    <Label>Project Type *</Label>
                    <Select value={projectType} onValueChange={setProjectType}>
                      <SelectTrigger data-testid="project-type-select" className="mt-2">
                        <SelectValue placeholder="Select Project Type (e.g., Residential Villa)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential (Single-family)">Residential (Single-family)</SelectItem>
                        <SelectItem value="Residential (Villa)">Residential (Villa)</SelectItem>
                        <SelectItem value="Commercial (Office)">Commercial (Office)</SelectItem>
                        <SelectItem value="Commercial (Retail)">Commercial (Retail)</SelectItem>
                        <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Site Constraints */}
                  <div>
                    <Label>Site Constraints</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input
                          data-testid="site-width-input"
                          type="number"
                          placeholder="Width (meters)"
                          value={siteWidth}
                          onChange={(e) => setSiteWidth(e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          data-testid="site-length-input"
                          type="number"
                          placeholder="Length (meters)"
                          value={siteLength}
                          onChange={(e) => setSiteLength(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label>Upload Site Boundary File (DXF)</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <input
                        data-testid="file-upload-input"
                        type="file"
                        accept=".dxf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">Drag & drop CAD files or PDFs here, or click to browse.</p>
                        {uploadedFile && (
                          <p className="text-blue-600 mt-2 font-medium">{uploadedFile.name}</p>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Required Spaces */}
                  <div>
                    <Label>Required Spaces</Label>
                    <div className="space-y-3 mt-2">
                      {requiredSpaces.map((space, idx) => (
                        <div key={idx} data-testid={`space-item-${idx}`} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              data-testid={`space-name-${idx}`}
                              placeholder="Room name"
                              value={space.name}
                              onChange={(e) => handleSpaceChange(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="w-24">
                            <Input
                              data-testid={`space-quantity-${idx}`}
                              type="number"
                              placeholder="Qty"
                              value={space.quantity}
                              onChange={(e) => handleSpaceChange(idx, 'quantity', e.target.value)}
                            />
                          </div>
                          <div className="w-28">
                            <Input
                              data-testid={`space-area-${idx}`}
                              type="number"
                              placeholder="Min m²"
                              value={space.minArea}
                              onChange={(e) => handleSpaceChange(idx, 'minArea', e.target.value)}
                            />
                          </div>
                          <Button
                            data-testid={`remove-space-${idx}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSpace(idx)}
                            disabled={requiredSpaces.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        data-testid="add-space-btn"
                        variant="outline"
                        onClick={handleAddSpace}
                        className="w-full border-dashed"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Space
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cultural Parameters */}
              <AccordionItem value="cultural" className="bg-white/90 backdrop-blur-sm border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                  Cultural/Religious Parameters
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label>Select Belief System</Label>
                    <Select value={culturalType} onValueChange={setCulturalType}>
                      <SelectTrigger data-testid="cultural-type-select" className="mt-2">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="vastu_general">General Vastu Shastra</SelectItem>
                        <SelectItem value="vastu_north">North Indian Vaastu</SelectItem>
                        <SelectItem value="vastu_south">South Indian Vaastu</SelectItem>
                        <SelectItem value="islamic">Islamic Beliefs</SelectItem>
                        <SelectItem value="christian">Christian Beliefs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Municipal Compliance */}
              <AccordionItem value="municipal" className="bg-white/90 backdrop-blur-sm border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                  Municipal Corporation Compliance
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label>Zoning/Building Code</Label>
                    <Select value={municipalCode} onValueChange={setMunicipalCode}>
                      <SelectTrigger data-testid="municipal-code-select" className="mt-2">
                        <SelectValue placeholder="Select Municipal Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General / National Code</SelectItem>
                        <SelectItem value="BBMP">BBMP (Bengaluru)</SelectItem>
                        <SelectItem value="BMC">BMC (Mumbai)</SelectItem>
                        <SelectItem value="MCD">MCD (Delhi)</SelectItem>
                        <SelectItem value="GHMC">GHMC (Hyderabad)</SelectItem>
                        <SelectItem value="CMDA">CMDA (Chennai)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Right: Configuration Summary */}
          <div>
            <Card className="bg-white/90 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Project Type</p>
                  <p className="font-medium">{projectType || 'Not selected'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Site Constraints</p>
                  <p className="font-medium">
                    {siteWidth && siteLength ? `${siteWidth}m x ${siteLength}m` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Required Spaces</p>
                  <ul className="text-sm space-y-1">
                    {requiredSpaces.filter(s => s.name).map((space, idx) => (
                      <li key={idx}>• {space.quantity}x {space.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cultural Parameters</p>
                  <p className="font-medium">{culturalType || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Compliance</p>
                  <p className="font-medium">{municipalCode || 'General'}</p>
                </div>
                <Button
                  data-testid="generate-plan-btn"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurePlan;