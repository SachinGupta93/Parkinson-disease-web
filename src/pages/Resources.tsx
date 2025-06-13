import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import GeminiChat from "@/components/GeminiChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain } from "lucide-react";

const Resources = () => {
  const resources = [
    {
      title: "Parkinson's Foundation",
      description: "Leading organization dedicated to research and support for Parkinson's disease.",
      link: "https://www.parkinson.org/"
    },
    {
      title: "Michael J. Fox Foundation",
      description: "Focused on finding a cure for Parkinson's disease through funded research and development.",
      link: "https://www.michaeljfox.org/"
    },
    {
      title: "National Institute of Neurological Disorders and Stroke",
      description: "Government resources on Parkinson's disease research and information.",
      link: "https://www.ninds.nih.gov/health-information/disorders/parkinsons-disease"
    },
    {
      title: "American Parkinson Disease Association",
      description: "Providing support, education, and research for those impacted by Parkinson's.",
      link: "https://www.apdaparkinson.org/"
    }
  ];
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-[calc(100vh-var(--header-height,8rem))]"> {/* Added min-h-screen with header adjustment & container classes */} 
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1> {/* Improved heading style */}
        <p className="text-lg text-muted-foreground mt-2">
          Educational materials and support resources for Parkinson's disease.
        </p>
      </div>
      
      <Tabs defaultValue="resources" className="w-full">        
        <TabsList className="mb-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10"> {/* Added background and sticky positioning to TabsList */}
          <TabsTrigger value="resources">External Resources</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resources" className="grid md:grid-cols-2 gap-6"> {/* Made grid responsive */}
          {resources.map((resource, idx) => (
          <Card key={idx} className="shadow-soft hover:shadow-md transition-shadow bg-card">
            <CardHeader>
              <CardTitle className="text-xl">{resource.title}</CardTitle> {/* Adjusted title size */}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">{resource.description}</p> {/* Adjusted text size */}
              <a 
                href={resource.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center text-sm font-medium" /* Adjusted text size and weight */
              >
                Visit Website
              </a>
            </CardContent>
          </Card>
          ))}
          
          <div className="md:col-span-2 p-6 bg-card rounded-lg shadow-soft"> {/* Spanning 2 columns on medium screens and above */}
            <h2 className="text-2xl font-semibold mb-4">About Parkinson's Disease</h2> {/* Improved heading style */}
            <Separator className="my-4"/>
            <p className="mb-3 text-muted-foreground">
              Parkinson's disease is a progressive nervous system disorder that affects movement. 
              Symptoms start gradually, sometimes starting with a barely noticeable tremor in just one hand. 
              Tremors are common, but the disorder also commonly causes stiffness or slowing of movement.
            </p>
            <p className="text-muted-foreground">
              Early detection and assessment can help with management and treatment options.
              This tool aims to assist in the early identification of symptoms that may be indicative of Parkinson's disease.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="ai-assistant">
          <Card className="bg-card shadow-soft"> {/* Added Card styling to GeminiChat container */}
            <CardContent className="p-4">
              <GeminiChat />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Resources;
