import React from 'react';
import { motion } from 'framer-motion'; // Ensure motion is imported

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-6 text-center text-primary dark:text-sky-400">About Parkinson's Disease</h1>
        
        <section className="mb-8 p-6 bg-white dark:bg-zinc-800 shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-primary-dark dark:text-sky-500">What is Parkinson's Disease?</h2>
          <p className="mb-4 text-lg leading-relaxed">
            Parkinson's disease (PD) is a progressive neurodegenerative disorder that primarily affects dopamine-producing neurons in a specific area of the brain called substantia nigra. Dopamine is a neurotransmitter that plays a vital role in regulating movement, motivation, and mood.
          </p>
          <p className="text-lg leading-relaxed">
            The cause of Parkinson's disease is unknown, but researchers believe that a combination of genetic and environmental factors may be involved. While there is currently no cure for PD, treatments are available to help manage symptoms and improve quality of life.
          </p>
        </section>

        <section className="mb-8 p-6 bg-white dark:bg-zinc-800 shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-primary-dark dark:text-sky-500">Common Symptoms</h2>
          <p className="mb-4 text-lg leading-relaxed">
            Symptoms of Parkinson's disease can vary from person to person and typically develop gradually. Common motor (movement-related) symptoms include:
          </p>
          <ul className="list-disc list-inside mb-4 pl-4 space-y-2 text-lg">
            <li><strong>Tremor:</strong> Involuntary shaking, often starting in a limb, especially at rest.</li>
            <li><strong>Bradykinesia:</strong> Slowness of movement, making simple tasks difficult and time-consuming.</li>
            <li><strong>Rigidity:</strong> Stiffness of the limbs, neck, or trunk, which can limit range of motion and cause pain.</li>
            <li><strong>Postural Instability:</strong> Impaired balance and coordination, which can lead to falls.</li>
          </ul>
          <p className="text-lg leading-relaxed">
            In addition to motor symptoms, individuals with PD may also experience non-motor symptoms such as sleep problems, constipation, depression, anxiety, fatigue, and cognitive changes. Voice and speech changes (dysarthria) are also common, including reduced volume, monotone speech, and imprecise articulation, which this application aims to help monitor.
          </p>
        </section>

        <section className="mb-8 p-6 bg-white dark:bg-zinc-800 shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-primary-dark dark:text-sky-500">Diagnosis and Treatment</h2>
          <p className="mb-4 text-lg leading-relaxed">
            Diagnosing Parkinson's disease can be challenging, especially in its early stages, as there is no specific test for the condition. Diagnosis is typically based on a person's medical history, a neurological examination, and the presence of characteristic motor symptoms.
          </p>
          <p className="mb-4 text-lg leading-relaxed">
            While there is no cure, various treatments can help manage symptoms. These include:
          </p>
          <ul className="list-disc list-inside mb-4 pl-4 space-y-2 text-lg">
            <li><strong>Medications:</strong> Drugs that increase or substitute for dopamine are the most common treatment.</li>
            <li><strong>Lifestyle Modifications:</strong> Regular exercise, a healthy diet, and stress management can be beneficial.</li>
            <li><strong>Therapies:</strong> Physical, occupational, and speech therapy can help with movement, daily activities, and communication.</li>
            <li><strong>Deep Brain Stimulation (DBS):</strong> A surgical procedure for some individuals with advanced PD whose symptoms are not adequately controlled by medication.</li>
          </ul>
        </section>
        
        <section className="p-6 bg-white dark:bg-zinc-800 shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-primary-dark dark:text-sky-500">Living with Parkinson's</h2>
          <p className="mb-4 text-lg leading-relaxed">
            Living with Parkinson's disease presents unique challenges, but with appropriate management and support, individuals can maintain a good quality of life. Support groups, educational resources, and ongoing communication with healthcare providers are crucial.
          </p>
          <p className="text-lg leading-relaxed">
            This application, Parkinson's Insight, aims to empower individuals by providing tools to monitor voice symptoms, which can be an important aspect of managing the condition. Early detection and consistent monitoring can aid in discussions with healthcare professionals and in tailoring treatment strategies.
          </p>
        </section>

        <footer className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health or treatment.</p>
        </footer>
      </motion.div>
    </div>
  );
};

export default AboutPage;
