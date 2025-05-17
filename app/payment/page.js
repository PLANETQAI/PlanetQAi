import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Users,
  Zap,
  Music,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Load Stripe outside of component render to avoid recreating Stripe object on each render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const SubscriptionPlans = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [error, setError] = useState(null);

  // Fetch pricing plans and user subscription on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pricing plans from API
        const plansRes = await fetch("/api/pricing-plans");
        if (!plansRes.ok) throw new Error("Failed to fetch pricing plans");
        const plansData = await plansRes.json();
        setPlans(plansData);

        // If user is logged in, fetch their subscription
        if (session?.user) {
          const subRes = await fetch("/api/user/subscription");
          if (subRes.ok) {
            const subData = await subRes.json();
            setUserSubscription(subData);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load subscription information");
      }
    };

    if (status !== "loading") {
      fetchData();
    }
  }, [session, status]);

  // Handle subscription checkout
  const handleSubscribe = async (planId) => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }

    try {
      setLoading(true);
      setLoadingPlanId(planId);

      // Create checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      router.push(url);
    } catch (err) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to initiate subscription process");
    } finally {
      setLoading(false);
      setLoadingPlanId(null);
    }
  };

  // Determine if user is already subscribed to a plan
  const isCurrentPlan = (planTitle) => {
    return (
      userSubscription &&
      userSubscription.planName.toLowerCase() === planTitle.toLowerCase() &&
      userSubscription.status === "Active"
    );
  };

  // If plans haven't loaded yet, show loading state
  if (plans.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 md:p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading subscription plans...</div>
      </div>
    );
  }

  // Use fallback plans if API fetch failed
  const displayPlans =
    plans.length > 0
      ? plans
      : [
          {
            id: "free-plan",
            title: "Free",
            description: "For casual exploration",
            price: "$0",
            frequency: "/month",
            features: [
              "50 credits upon sign up",
              "Renew 50 credits monthly",
              "Standard audio quality",
              "Basic usage rights",
            ],
            buttonText: "Start Free Trial",
            buttonVariant: "outline",
            buttonClassName:
              "bg-transparent text-white border-white/20 hover:bg-white/10 hover:border-white/30",
            mostPopular: false,
          },
          {
            id: "starter-plan",
            title: "Starter",
            description: "For hobbyists and creators",
            price: "$5",
            frequency: "/month",
            features: [
              "100 credits upon sign up",
              "Renew 100 credits monthly",
              "Standard audio quality",
              "Commercial usage rights",
            ],
            buttonText: "Get Started",
            buttonVariant: "default",
            buttonClassName:
              "bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600",
            mostPopular: false,
          },
          {
            id: "pro-plan",
            title: "Pro",
            description: "For creators who need more",
            price: "$15",
            frequency: "/month",
            features: [
              "500 credits upon sign up",
              "Renew 500 credits monthly",
              "High audio quality",
              "Commercial usage rights",
              "Early access to new features",
            ],
            buttonText: "Upgrade to Pro",
            buttonVariant: "default",
            buttonClassName:
              "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600",
            mostPopular: true,
          },
          {
            id: "premium-plan",
            title: "Premium",
            description: "For professionals and teams",
            price: "$30",
            frequency: "/month",
            features: [
              "1200 credits upon sign up",
              "Renew 1200 credits monthly",
              "High audio quality",
              "Full commercial usage rights",
              "Priority support",
              "Team collaboration features",
            ],
            buttonText: "Go Premium",
            buttonVariant: "default",
            buttonClassName:
              "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600",
            mostPopular: false,
          },
        ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Title and Description */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400">
            Pricing Plans
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Choose the plan that's right for you. Start with our free plan, or
            get more credits and features with a Pro subscription.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Current subscription notice */}
        {userSubscription && userSubscription.status === "Active" && (
          <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-purple-300">
              <CreditCard size={20} />
              <p>
                You're currently on the{" "}
                <span className="font-bold">{userSubscription.planName}</span>{" "}
                plan.
                {userSubscription.cancelAtPeriodEnd
                  ? ` Your subscription will end on ${new Date(
                      userSubscription.currentPeriodEnd
                    ).toLocaleDateString()}.`
                  : ` Renews on ${new Date(
                      userSubscription.currentPeriodEnd
                    ).toLocaleDateString()}.`}
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {displayPlans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={cn(
                "bg-white/5 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl border border-white/10",
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20",
                plan.mostPopular && "border-purple-500/30 shadow-purple-500/20",
                isCurrentPlan(plan.title) &&
                  "border-green-500/30 shadow-green-500/20",
                "space-y-6"
              )}
            >
              {/* Most Popular Label */}
              {plan.mostPopular && (
                <div className="text-center">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Label */}
              {isCurrentPlan(plan.title) && (
                <div className="text-center">
                  <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Current Plan
                  </span>
                </div>
              )}

              {/* Title, Price, and Description */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {plan.title}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-lg sm:text-xl">
                    {plan.frequency}
                  </span>
                </div>
                <p className="text-gray-300 text-sm sm:text-base">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                {plan.features.map((feature, i) => {
                  const isCreditFeature = feature.includes("credits");
                  let FeatureIcon = CheckCircle;
                  if (isCreditFeature) {
                    FeatureIcon = Users;
                  } else if (feature.includes("audio")) {
                    FeatureIcon = Music;
                  }
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <FeatureIcon
                        className="w-5 h-5"
                        style={{
                          color: isCreditFeature ? "#3b82f6" : "#22c55e",
                        }}
                      />
                      <span className="text-gray-200 text-sm sm:text-base">
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Call to Action Button */}
              <Button
                variant={plan.buttonVariant}
                className={cn(
                  "w-full py-3 sm:py-4 text-sm sm:text-base font-semibold",
                  plan.buttonClassName,
                  "transition-all duration-300",
                  "shadow-lg"
                )}
                disabled={isCurrentPlan(plan.title) || loading}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading && loadingPlanId === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : isCurrentPlan(plan.title) ? (
                  "Current Plan"
                ) : (
                  plan.buttonText
                )}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Credits Usage Information */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl border border-white/10 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-white mb-4">
            How Credits Work
          </h3>
          <div className="space-y-4 text-gray-300">
            <p>
              Credits are used to generate songs with our AI system. Each song
              generation consumes credits based on the duration of processing:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Each second of processing time costs approximately 5 credits
              </li>
              <li>
                A typical 30-second song might take 10-15 seconds to generate
                (50-75 credits)
              </li>
              <li>
                Higher quality settings may increase processing time and credit
                usage
              </li>
              <li>
                Credits are replenished monthly based on your subscription plan
              </li>
            </ul>
            <p>
              Your credit balance is visible in your account dashboard, where
              you can also track your usage history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
