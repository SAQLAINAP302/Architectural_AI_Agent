import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Grid3x3, Shield, Calculator, ArrowRight, Compass } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Homepage = () => {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    fetchRecentProjects();
  }, []);

  const fetchRecentProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setRecentProjects(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const features = [
    {
      icon: <Grid3x3 className="w-8 h-8" />,
      title: 'Automated Floor Plan Generation',
      description: 'Instantly create optimized and efficient floor plans from your specifications.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Compliance Verification',
      description: 'Automatically check your designs against local building codes and regulations.'
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: 'Material Estimation',
      description: 'Get accurate material takeoffs and cost estimations in minutes, not days.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="backdrop-blur-sm bg-white/80 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>ArchAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#projects" className="text-gray-600 hover:text-gray-900 transition-colors">Projects</a>
            <Button data-testid="upgrade-btn" variant="outline" className="rounded-full">Upgrade</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: 'Space Grotesk' }}>
          Design Smarter Buildings,<br />Faster.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Leverage AI for automated floor plan generation, compliance verification, and material estimation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            data-testid="start-new-project-btn"
            onClick={() => navigate('/configure')}
            size="lg"
            className="rounded-full px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700"
          >
            Start New Project <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            data-testid="load-existing-project-btn"
            variant="outline"
            size="lg"
            className="rounded-full px-8 py-6 text-lg"
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Load Existing Project
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              data-testid={`feature-card-${idx}`}
              className="border border-gray-200 hover:shadow-xl transition-shadow duration-300 bg-white/90 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk' }}>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section id="projects" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Jump Back In</h2>
        </div>
        {recentProjects.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                data-testid={`project-card-${project.id}`}
                className="cursor-pointer hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white"
                onClick={() => navigate(`/review/${project.id}`)}
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Compass className="w-16 h-16 text-blue-400" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    Last modified: {new Date(project.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/80">
            <p className="text-gray-500 mb-4">No recent projects found</p>
            <Button
              data-testid="create-first-project-btn"
              onClick={() => navigate('/configure')}
              variant="outline"
              className="rounded-full"
            >
              Create Your First Project
            </Button>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-600">
          <p>© 2024 ArchAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;