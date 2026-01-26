import EvaluationForm from '../components/EvaluationForm';
import { Code2, BarChart3, Lightbulb, Share2 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Evaluate Your GitHub Repository
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get an AI-powered comprehensive analysis of your code quality, architecture,
            and product value in seconds.
          </p>
        </div>

        {/* Evaluation Form */}
        <EvaluationForm />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          What You Get
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Code2 className="w-8 h-8" />}
            title="Code Quality Analysis"
            description="Deep analysis of code structure, testing, documentation, and best practices."
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Comprehensive Metrics"
            description="Language distribution, complexity metrics, test coverage, and dependency analysis."
          />
          <FeatureCard
            icon={<Lightbulb className="w-8 h-8" />}
            title="Actionable Insights"
            description="Specific recommendations with priority levels and expected impact on your score."
          />
          <FeatureCard
            icon={<Share2 className="w-8 h-8" />}
            title="Shareable Reports"
            description="Permanent links, social sharing, and README badges to showcase your work."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>

        <div className="max-w-3xl mx-auto space-y-8">
          <Step
            number={1}
            title="Enter Repository URL"
            description="Simply paste your GitHub repository URL or select from examples."
          />
          <Step
            number={2}
            title="AI-Powered Analysis"
            description="Our system analyzes code structure, tests, documentation, security, and more."
          />
          <Step
            number={3}
            title="Get Your Score"
            description="Receive a score out of 100 with detailed breakdown and actionable recommendations."
          />
          <Step
            number={4}
            title="Share & Improve"
            description="Share your results and implement suggestions to improve your repository."
          />
        </div>
      </section>

      {/* Scoring Rubric Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Evaluation Criteria
        </h2>

        <div className="max-w-4xl mx-auto space-y-6">
          <RubricCard
            title="Code Quality (60 points)"
            items={[
              'Testing: Test coverage, quality, and edge cases (20 pts)',
              'Code Organization: Structure, modularity, separation of concerns (15 pts)',
              'Documentation: README, comments, API documentation (10 pts)',
              'Performance: Algorithm efficiency and scalability (10 pts)',
              'Best Practices: Error handling, security, CI/CD (5 pts)',
            ]}
          />
          <RubricCard
            title="Product Quality (40 points)"
            items={[
              'Problem Novelty: Uniqueness and innovation (15 pts)',
              'Real-World Utility: Solves genuine need, production-ready (15 pts)',
              'Technical Difficulty: Problem complexity and sophistication (10 pts)',
            ]}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-blue-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Evaluate Your Repository?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get comprehensive insights and actionable recommendations in seconds.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 GitEval. Powered by Claude AI.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function RubricCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-gray-700">
            <span className="text-blue-600 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
