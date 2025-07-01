import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import GeminiChat from "@/components/GeminiChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  BookOpen, 
  ExternalLink, 
  Home, 
  Globe, 
  FileText, 
  GraduationCap, 
  Users, 
  HeartPulse, 
  Stethoscope, 
  ArrowRight,
  MessageSquare,
  Info,
  Search,
  Video,
  Newspaper,
  Lightbulb,
  Activity
} from "lucide-react";

const Resources = () => {
  const navigate = useNavigate();
  
  const resources = [
    {
      title: "Parkinson's Foundation",
      description: "Leading organization dedicated to research and support for Parkinson's disease.",
      link: "https://www.parkinson.org/",
      icon: <HeartPulse className="h-5 w-5 text-red-600 dark:text-red-400" />,
      category: "Support"
    },
    {
      title: "Michael J. Fox Foundation",
      description: "Focused on finding a cure for Parkinson's disease through funded research and development.",
      link: "https://www.michaeljfox.org/",
      icon: <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      category: "Research"
    },
    {
      title: "National Institute of Neurological Disorders and Stroke",
      description: "Government resources on Parkinson's disease research and information.",
      link: "https://www.ninds.nih.gov/health-information/disorders/parkinsons-disease",
      icon: <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      category: "Information"
    },
    {
      title: "American Parkinson Disease Association",
      description: "Providing support, education, and research for those impacted by Parkinson's.",
      link: "https://www.apdaparkinson.org/",
      icon: <Users className="h-5 w-5 text-green-600 dark:text-green-400" />,
      category: "Support"
    },
    {
      title: "Parkinson's UK",
      description: "UK's leading charity supporting those with Parkinson's disease and funding research.",
      link: "https://www.parkinsons.org.uk/",
      icon: <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      category: "Support"
    },
    {
      title: "World Parkinson Coalition",
      description: "Global organization that hosts the World Parkinson Congress every three years.",
      link: "https://www.worldpdcoalition.org/",
      icon: <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      category: "Information"
    }
  ];

  const educationalResources = [
    {
      title: "Understanding Parkinson's Disease",
      description: "Comprehensive guide to understanding the basics of Parkinson's disease.",
      link: "https://www.mayoclinic.org/diseases-conditions/parkinsons-disease/symptoms-causes/syc-20376055",
      icon: <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      type: "Article"
    },
    {
      title: "Parkinson's Disease: Hope Through Research",
      description: "In-depth research information from the National Institute of Neurological Disorders and Stroke.",
      link: "https://www.ninds.nih.gov/health-information/patient-caregiver-education/hope-through-research/parkinsons-disease-hope-through-research",
      icon: <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      type: "Research"
    },
    {
      title: "Parkinson's Disease: Symptoms & Treatment",
      description: "Video explaining symptoms and treatment options for Parkinson's disease.",
      link: "https://www.youtube.com/watch?v=nwh5eCuwe_k",
      icon: <Video className="h-5 w-5 text-red-600 dark:text-red-400" />,
      type: "Video"
    },
    {
      title: "Latest News in Parkinson's Research",
      description: "Stay updated with the latest developments in Parkinson's disease research.",
      link: "https://www.michaeljfox.org/news",
      icon: <Newspaper className="h-5 w-5 text-green-600 dark:text-green-400" />,
      type: "News"
    }
  ];
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Resources
            </h1>
            <p className="text-muted-foreground mt-1">
              Educational materials and support resources for Parkinson's disease
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="resources" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="resources" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <Globe className="h-4 w-4 mr-2" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="educational" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <BookOpen className="h-4 w-4 mr-2" />
              Educational
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="resources" className="focus:outline-none">
            <div className="space-y-8">
              {/* About Parkinson's */}
              <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30">
                <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    About Parkinson's Disease
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">
                      Parkinson's disease is a progressive nervous system disorder that affects movement. 
                      Symptoms start gradually, sometimes starting with a barely noticeable tremor in just one hand. 
                      Tremors are common, but the disorder also commonly causes stiffness or slowing of movement.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      Early detection and assessment can help with management and treatment options.
                      This tool aims to assist in the early identification of symptoms that may be indicative of Parkinson's disease.
                    </p>
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/about')}
                        className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      >
                        Learn More
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizations Grid */}
              <div>
                <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Parkinson's Organizations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.map((resource, idx) => (
                    <Card key={idx} className="border shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-2">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                            {resource.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{resource.title}</CardTitle>
                            <CardDescription className="text-xs">{resource.category}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{resource.description}</p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full flex items-center justify-between border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                          onClick={() => window.open(resource.link, '_blank')}
                        >
                          <span className="flex items-center">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Visit Website
                          </span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Educational Tab */}
          <TabsContent value="educational" className="focus:outline-none">
            <div className="space-y-8">
              {/* Educational Resources */}
              <div>
                <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Educational Resources
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {educationalResources.map((resource, idx) => (
                    <Card key={idx} className="border shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-2">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                            {resource.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{resource.title}</CardTitle>
                            <CardDescription className="text-xs">{resource.type}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{resource.description}</p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full flex items-center justify-between border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                          onClick={() => window.open(resource.link, '_blank')}
                        >
                          <span className="flex items-center">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            View Resource
                          </span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tips for Living with Parkinson's */}
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    Tips for Living with Parkinson's
                  </CardTitle>
                  <CardDescription>
                    Practical advice for managing daily life with Parkinson's disease
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Stay Active</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Regular exercise can help maintain mobility, balance, and flexibility. Consider activities like walking, swimming, or tai chi.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                          <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Join a Support Group</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connecting with others who understand your experience can provide emotional support and practical advice.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                          <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Work with Specialists</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            A team approach including neurologists, physical therapists, and speech therapists can provide comprehensive care.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                          <HeartPulse className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Monitor Symptoms</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Keep track of your symptoms and how they change over time. This information can help your healthcare team adjust your treatment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="focus:outline-none">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about Parkinson's disease and get AI-powered answers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white dark:bg-gray-900 p-4 border-b">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full mt-0.5">
                      <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">How to use the AI Assistant</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        You can ask questions about Parkinson's disease, symptoms, treatments, or living with the condition. 
                        The AI will provide informational responses based on current knowledge. Remember that this is not 
                        a substitute for professional medical advice.
                      </p>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs text-gray-600 dark:text-gray-400">
                          "What are the early signs of Parkinson's disease?"
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs text-gray-600 dark:text-gray-400">
                          "How does exercise help with Parkinson's symptoms?"
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 h-[600px]">
                  <GeminiChat />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-900/50 border-t p-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>This AI assistant provides general information only and is not a substitute for professional medical advice.</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Resources;