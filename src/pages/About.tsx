import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Activity, 
  Stethoscope, 
  HeartPulse, 
  Users, 
  BookOpen, 
  ExternalLink, 
  ArrowRight, 
  Home,
  Info,
  AlertTriangle,
  Lightbulb,
  Microscope,
  Pill
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              About Parkinson's Disease
            </h1>
            <p className="text-muted-foreground mt-1">
              Understanding the condition, symptoms, and treatment options
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

        {/* Hero Section */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold mb-4">What is Parkinson's Disease?</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Parkinson's disease (PD) is a progressive neurodegenerative disorder that primarily affects dopamine-producing neurons in a specific area of the brain called substantia nigra. Dopamine is a neurotransmitter that plays a vital role in regulating movement, motivation, and mood.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    The cause of Parkinson's disease is unknown, but researchers believe that a combination of genetic and environmental factors may be involved. While there is currently no cure for PD, treatments are available to help manage symptoms and improve quality of life.
                  </p>
                </motion.div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative"
                >
                  <div className="w-64 h-64 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Brain className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                    <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                    <Stethoscope className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="symptoms" className="w-full mb-8">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="symptoms" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <Activity className="h-4 w-4 mr-2" />
              Symptoms
            </TabsTrigger>
            <TabsTrigger value="diagnosis" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <Microscope className="h-4 w-4 mr-2" />
              Diagnosis
            </TabsTrigger>
            <TabsTrigger value="treatment" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <Pill className="h-4 w-4 mr-2" />
              Treatment
            </TabsTrigger>
            <TabsTrigger value="living" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-50">
              <Users className="h-4 w-4 mr-2" />
              Living with PD
            </TabsTrigger>
          </TabsList>

          {/* Symptoms Tab */}
          <TabsContent value="symptoms" className="focus:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Common Symptoms
                  </CardTitle>
                  <CardDescription>
                    Symptoms of Parkinson's disease can vary from person to person and typically develop gradually
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Common motor (movement-related) symptoms include:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                          <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Tremor</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Involuntary shaking, often starting in a limb, especially at rest. This is often one of the first noticeable symptoms.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                          <HeartPulse className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Bradykinesia</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Slowness of movement, making simple tasks difficult and time-consuming. May affect walking, getting up from chairs, and daily activities.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Rigidity</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Stiffness of the limbs, neck, or trunk, which can limit range of motion and cause pain. May feel like resistance when moving limbs.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                          <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Postural Instability</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Impaired balance and coordination, which can lead to falls. Often develops in later stages of the disease.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-indigo-900 dark:text-indigo-300 mb-1">Non-Motor Symptoms</h3>
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80">
                          In addition to motor symptoms, individuals with PD may also experience non-motor symptoms such as sleep problems, constipation, depression, anxiety, fatigue, and cognitive changes. Voice and speech changes (dysarthria) are also common, including reduced volume, monotone speech, and imprecise articulation, which this application aims to help monitor.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="focus:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Microscope className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Diagnosis Process
                  </CardTitle>
                  <CardDescription>
                    Diagnosing Parkinson's disease can be challenging, especially in its early stages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    There is no specific test for Parkinson's disease. Diagnosis is typically based on a person's medical history, a neurological examination, and the presence of characteristic motor symptoms.
                  </p>
                  
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">Diagnostic Approach</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Medical History</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            The doctor will review your medical history and ask about your symptoms, when they began, and how they've changed over time.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Neurological Examination</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            The doctor will assess your movement, muscle tone, gait, and balance to look for signs of Parkinson's disease.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Response to Medication</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Improvement in symptoms after taking levodopa (a Parkinson's medication) can help confirm the diagnosis.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Imaging Tests</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            MRI or CT scans may be used to rule out other conditions that could cause similar symptoms.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-yellow-900 dark:text-yellow-300 mb-1">Early Detection is Key</h3>
                        <p className="text-sm text-yellow-800/80 dark:text-yellow-400/80">
                          Early diagnosis of Parkinson's disease can lead to better management of symptoms and improved quality of life. If you notice persistent tremors, stiffness, or slowness of movement, consult with a healthcare professional. Tools like this application can help track potential symptoms over time.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment" className="focus:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Treatment Options
                  </CardTitle>
                  <CardDescription>
                    While there is no cure, various treatments can help manage symptoms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Treatment for Parkinson's disease is focused on managing symptoms and improving quality of life. A comprehensive approach often includes:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                          <Pill className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Medications</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Drugs that increase or substitute for dopamine are the most common treatment. These include levodopa, dopamine agonists, MAO-B inhibitors, and COMT inhibitors.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                          <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Lifestyle Modifications</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Regular exercise, a healthy diet, and stress management can be beneficial. Exercise has been shown to improve mobility, balance, and overall well-being.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                          <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Therapies</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Physical, occupational, and speech therapy can help with movement, daily activities, and communication. These therapies can be crucial for maintaining independence.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                          <Brain className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Deep Brain Stimulation (DBS)</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            A surgical procedure for some individuals with advanced PD whose symptoms are not adequately controlled by medication. It involves implanting electrodes in specific areas of the brain.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Personalized Treatment</h3>
                        <p className="text-sm text-blue-800/80 dark:text-blue-400/80">
                          Treatment plans are highly individualized and may change over time as the disease progresses. Regular follow-ups with healthcare providers are essential to adjust treatments as needed and address new symptoms as they arise.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Living with PD Tab */}
          <TabsContent value="living" className="focus:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Living with Parkinson's
                  </CardTitle>
                  <CardDescription>
                    Strategies and resources for managing life with Parkinson's disease
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Living with Parkinson's disease presents unique challenges, but with appropriate management and support, individuals can maintain a good quality of life. Here are some strategies and resources that can help:
                  </p>
                  
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">Strategies for Daily Living</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Support Networks</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect with support groups, either in-person or online, to share experiences and coping strategies with others who understand what you're going through.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Education</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Stay informed about Parkinson's disease, treatment options, and research developments. Knowledge empowers you to actively participate in your care.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Regular Exercise</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Maintain a consistent exercise routine tailored to your abilities. Activities like walking, swimming, tai chi, and yoga can help maintain mobility and balance.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full flex-shrink-0">
                          <Stethoscope className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Healthcare Team</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Work closely with a multidisciplinary healthcare team, including neurologists, physical therapists, occupational therapists, and speech therapists.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-green-900 dark:text-green-300 mb-1">Monitoring Tools</h3>
                        <p className="text-sm text-green-800/80 dark:text-green-400/80">
                          This application, Parkinson's Insight, aims to empower individuals by providing tools to monitor voice symptoms, which can be an important aspect of managing the condition. Early detection and consistent monitoring can aid in discussions with healthcare professionals and in tailoring treatment strategies.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-between border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      onClick={() => window.open('https://www.parkinson.org/', '_blank')}
                    >
                      <span className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Parkinson's Foundation
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-between border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      onClick={() => window.open('https://www.michaeljfox.org/', '_blank')}
                    >
                      <span className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Michael J. Fox Foundation
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950/30">
          <CardHeader className="pb-2 border-b border-yellow-100 dark:border-yellow-900/30">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              Medical Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health or treatment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;