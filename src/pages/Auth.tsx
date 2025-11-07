import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { claimGetLateProfile } from "@/lib/getlateProfile";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [profileClaimError, setProfileClaimError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isRegistering) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !isRegistering) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isRegistering]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signUpSchema.safeParse({ email, password, username });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    setIsRegistering(true);
    setProfileClaimError(null);
    
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Step 1: Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
          },
        },
      });

      if (signUpError) throw signUpError;
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // If email confirmation is required, show verification screen
      if (!authData.session) {
        toast.success("Account created! Please check your email to verify your account.");
        setVerificationEmailSent(true);
        setVerificationEmail(email);
        setIsRegistering(false);
        setLoading(false);
        return;
      }

      // Step 2: Wait for profile to be created by trigger
      let profileExists = false;
      let retries = 0;
      const maxRetries = 10;
      
      while (!profileExists && retries < maxRetries) {
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (profileCheck) {
          profileExists = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }
      }

      if (!profileExists) {
        await supabase.auth.signOut();
        throw new Error('Profile creation timed out. Please try again.');
      }

      // Step 3: Claim a GetLate profile
      const claimResult = await claimGetLateProfile();

      if (!claimResult.success) {
        if (claimResult.error === 'no_access') {
          // Show dedicated error screen
          setProfileClaimError(claimResult.message || "You don't have access to claim a new profile. Please contact customer support for help.");
          await supabase.auth.signOut();
          setIsRegistering(false);
          setLoading(false);
          return;
        } else {
          // Generic error
          await supabase.auth.signOut();
          throw new Error(claimResult.message || 'Failed to set up your profile. Please try again.');
        }
      }

      toast.success("Account created successfully!");
      setIsRegistering(false);
      setLoading(false);
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
      setIsRegistering(false);
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });

      if (error) throw error;
      toast.success("Verification email resent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  // Show profile claim error screen
  if (profileClaimError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md shadow-glow">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
              <Video className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
              <CardDescription className="text-base">
                {profileClaimError}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button 
              onClick={() => window.open('mailto:support@socialreelpilot.com', '_blank')}
              className="w-full"
              size="lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button 
              onClick={() => {
                setProfileClaimError(null);
                setEmail("");
                setPassword("");
                setUsername("");
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md shadow-glow">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-2xl">
                <Video className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{verificationEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please check your email and click the verification link to activate your account.
            </p>
            <Button 
              onClick={handleResendVerification} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Resending..." : "Resend Verification Email"}
            </Button>
            <Button 
              onClick={() => {
                setVerificationEmailSent(false);
                setEmail("");
                setPassword("");
                setUsername("");
              }} 
              variant="ghost" 
              className="w-full"
            >
              Back to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl">
              <Video className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">ReelHub</CardTitle>
          <CardDescription>
            Manage and schedule your social media reels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="creator123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
