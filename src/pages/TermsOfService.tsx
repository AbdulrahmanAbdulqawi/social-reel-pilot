import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            ← Back to Home
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using ReelHub, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="text-muted-foreground">
              Permission is granted to temporarily access ReelHub for personal, non-commercial use only. This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Content Guidelines</h2>
            <p className="text-muted-foreground">
              Users must ensure that all content uploaded to ReelHub complies with applicable laws and does not infringe on the rights of third parties. We reserve the right to remove content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Service Modifications</h2>
            <p className="text-muted-foreground">
              ReelHub reserves the right to modify or discontinue the service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              In no event shall ReelHub be liable for any damages arising out of the use or inability to use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us through our support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
