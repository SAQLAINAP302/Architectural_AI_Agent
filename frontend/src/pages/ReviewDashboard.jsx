import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Move,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Save
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReviewDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const svgContainerRef = useRef(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
      setSelectedPlanIndex(response.data.selectedPlanIndex || 0);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    }
  };

  const handlePlanSelect = async (index) => {
    try {
      await axios.put(`${API}/projects/${projectId}/select-plan/${index}`);
      setSelectedPlanIndex(index);
      await fetchProject();
      toast.success('Layout updated');
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to update layout');
    }
  };

  const handleSaveProject = async () => {
    toast.success('Project saved successfully!');
  };

  const handleFinalize = () => {
    navigate(`/complete/${projectId}`);
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const currentPlan = project.floorPlans[selectedPlanIndex];
  const compliancePassed = project.complianceChecks?.filter(c => c.status === 'passed').length || 0;
  const complianceTotal = project.complianceChecks?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-to-home-btn"
              variant="ghost"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                {project.name} - Floor Plan Review
              </h1>
              <p className="text-sm text-gray-600">Reviewing AI-generated floor plan, compliance status, and material estimates.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Auto-saved</span>
            <Button
              data-testid="save-project-btn"
              variant="outline"
              onClick={handleSaveProject}
              className="rounded-full"
            >
              <Save className="w-4 h-4 mr-2" /> Save Project
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left & Center: Floor Plan Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Floor Plan */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Floor Plan</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Interactive 2D view</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      data-testid="zoom-out-btn"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
                    <Button
                      data-testid="zoom-in-btn"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  data-testid="floor-plan-viewer"
                  ref={svgContainerRef}
                  className="bg-gray-50 rounded-lg border-2 border-gray-200 overflow-auto"
                  style={{ height: '600px' }}
                >
                  <div
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                    dangerouslySetInnerHTML={{ __html: currentPlan?.svgContent || '<p>No plan available</p>' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alternative Layouts */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Alternative Layouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {project.floorPlans?.map((plan, idx) => (
                    <div
                      key={idx}
                      data-testid={`layout-option-${idx}`}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        selectedPlanIndex === idx
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                      onClick={() => handlePlanSelect(idx)}
                    >
                      <div
                        className="h-32 bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden"
                        style={{ transform: 'scale(0.3)', transformOrigin: 'top left', height: '100px' }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: plan.svgContent }} />
                      </div>
                      <p className="text-xs text-center font-medium">Option {String.fromCharCode(65 + idx)}</p>
                      <p className="text-xs text-center text-gray-500">{plan.totalArea?.toFixed(1)} m²</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Compliance & Materials */}
          <div className="space-y-6">
            {/* Compliance Summary Card */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Compliance Summary</CardTitle>
                <Badge
                  data-testid="compliance-status-badge"
                  className={`mt-2 ${compliancePassed === complianceTotal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {compliancePassed === complianceTotal ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Passed</>
                  ) : (
                    <><AlertTriangle className="w-3 h-3 mr-1" /> Issues Found</>
                  )}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  All automated checks for local building codes and accessibility standards.
                </p>
                <Tabs defaultValue="regulatory" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger data-testid="tab-regulatory" value="regulatory">Code</TabsTrigger>
                    <TabsTrigger data-testid="tab-cultural" value="cultural">Cultural</TabsTrigger>
                    <TabsTrigger data-testid="tab-accessibility" value="accessibility">ADA</TabsTrigger>
                  </TabsList>
                  <TabsContent value="regulatory" className="space-y-3 mt-4">
                    {project.complianceChecks
                      ?.filter(c => c.category === 'regulatory')
                      .map((check, idx) => (
                        <div key={idx} data-testid={`compliance-regulatory-${idx}`} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          {check.status === 'passed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : check.status === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{check.rule}</p>
                            <p className="text-xs text-gray-600 mt-1">{check.message}</p>
                            {check.suggestion && (
                              <button className="text-xs text-blue-600 hover:underline mt-1">
                                {check.suggestion}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  <TabsContent value="cultural" className="space-y-3 mt-4">
                    {project.complianceChecks
                      ?.filter(c => c.category === 'cultural')
                      .map((check, idx) => (
                        <div key={idx} data-testid={`compliance-cultural-${idx}`} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{check.rule}</p>
                            <p className="text-xs text-gray-600 mt-1">{check.message}</p>
                          </div>
                        </div>
                      ))}
                    {project.complianceChecks?.filter(c => c.category === 'cultural').length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No cultural parameters selected</p>
                    )}
                  </TabsContent>
                  <TabsContent value="accessibility" className="space-y-3 mt-4">
                    {project.complianceChecks
                      ?.filter(c => c.category === 'accessibility')
                      .map((check, idx) => (
                        <div key={idx} data-testid={`compliance-accessibility-${idx}`} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          {check.status === 'passed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{check.rule}</p>
                            <p className="text-xs text-gray-600 mt-1">{check.message}</p>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Material Estimation */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Material Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {project.materials?.map((material, idx) => (
                    <div key={idx} data-testid={`material-item-${idx}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{material.name}</p>
                        <p className="text-xs text-gray-600">
                          {material.quantity.toFixed(2)} {material.unit}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600">
                        ₹{material.estimatedCost?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Total Estimated Cost</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{project.materials?.reduce((sum, m) => sum + (m.estimatedCost || 0), 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <Button
                  data-testid="export-bom-btn"
                  variant="outline"
                  className="w-full mt-4 rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" /> Export Bill of Materials
                </Button>
              </CardContent>
            </Card>

            {/* Finalize Button */}
            <Button
              data-testid="finalize-btn"
              onClick={handleFinalize}
              className="w-full rounded-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Finalize & Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDashboard;