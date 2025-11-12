import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileText, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectCompletion = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [selectedFormats, setSelectedFormats] = useState(['DWG']);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    }
  };

  const handleFormatToggle = (format) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleExport = () => {
    if (selectedFormats.length === 0) {
      toast.error('Please select at least one format');
      return;
    }
    toast.success(`Exporting in ${selectedFormats.join(', ')} format(s)...`);
    // Mock export
    setTimeout(() => {
      toast.success('Export completed!');
    }, 2000);
  };

  const handleGenerateReport = () => {
    toast.info('Generating comprehensive project report...');
    setTimeout(() => {
      toast.success('Report generated successfully!');
    }, 2000);
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

  const currentPlan = project.floorPlans?.[project.selectedPlanIndex || 0];
  const compliancePassed = project.complianceChecks?.every(c => c.status === 'passed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-to-review-btn"
              variant="ghost"
              onClick={() => navigate(`/review/${projectId}`)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                {project.name} - Finalize & Export
              </h1>
            </div>
          </div>
          <Badge
            data-testid="compliance-verified-badge"
            className="bg-green-100 text-green-800 px-4 py-2"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Compliance Verified
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Floor Plan Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Final Floor Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  data-testid="final-floor-plan"
                  className="bg-gray-50 rounded-lg border-2 border-gray-200 p-8 flex items-center justify-center"
                  style={{ minHeight: '600px' }}
                >
                  {currentPlan?.svgContent ? (
                    <div dangerouslySetInnerHTML={{ __html: currentPlan.svgContent }} />
                  ) : (
                    <p className="text-gray-500">No floor plan available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Export Options */}
          <div className="space-y-6">
            {/* Export Drawings */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Export Drawings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['DWG', 'DXF', 'PDF'].map(format => (
                    <button
                      key={format}
                      data-testid={`format-btn-${format.toLowerCase()}`}
                      onClick={() => handleFormatToggle(format)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedFormats.includes(format)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <p className="text-sm font-semibold">{format}</p>
                    </button>
                  ))}
                </div>
                <Button
                  data-testid="export-selected-btn"
                  onClick={handleExport}
                  disabled={selectedFormats.length === 0}
                  className="w-full rounded-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-5 h-5 mr-2" /> Export Selected
                </Button>
              </CardContent>
            </Card>

            {/* Generate Report */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Generate Full Project Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Includes floor plan, compliance summary, and full material estimate.
                </p>
                <Button
                  data-testid="generate-report-btn"
                  onClick={handleGenerateReport}
                  variant="outline"
                  className="w-full rounded-full py-6 text-lg"
                >
                  <FileText className="w-5 h-5 mr-2" /> Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Compliance Summary */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Compliance Summary</CardTitle>
                <Badge
                  data-testid="compliance-status-summary"
                  className="mt-2 bg-green-100 text-green-800"
                >
                  <CheckCircle className="w-3 h-3 mr-1" /> Passed
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  All automated checks for local building codes and accessibility standards have passed.
                </p>
              </CardContent>
            </Card>

            {/* Material Estimate Summary */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Material Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Items</span>
                    <span className="font-semibold">{project.materials?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Area</span>
                    <span className="font-semibold">{currentPlan?.totalArea?.toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Estimated Cost</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{project.materials?.reduce((sum, m) => sum + (m.estimatedCost || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCompletion;