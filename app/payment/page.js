"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
// Use null-check to avoid 'match' error in SSR context
let stripePromise;
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

// CSS classes for animations are defined in global.css

const SubscriptionPlans = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user subscription on component mount
  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        if (session?.user) {
          const subRes = await fetch("/api/subscriptions/plans", {
            method: "GET",
            headers: { 
              "Content-Type": "application/json"
            },
            cache: "no-store" // Ensure fresh data
          });
          
          if (!subRes.ok) {
            throw new Error(`Failed to load subscription data: ${subRes.status}`);
          }
          
          const subData = await subRes.json();
          // Set the userSubscription to the userSubscription property from the response
          // If userSubscription is null, set it to an empty object to avoid null reference errors
          setUserSubscription(subData.userSubscription || {});
        }
      } catch (err) {
        console.error("Error fetching subscription data:", err);
        setError("Failed to load subscription information");
      }
    };

    if (status !== "loading") {
      fetchUserSubscription();
    }
  }, [session, status]);

  // Direct test function to open Stripe checkout
  const testStripeCheckout = async () => {
    try {
      console.log('Testing direct Stripe checkout');
      
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: 10
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await response.json();
      console.log('Checkout data:', data);
      
      if (data.url) {
        console.log('Opening URL:', data.url);
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Test checkout error:', error);
      alert('Error: ' + error.message);
    }
  };

  // Handle subscription checkout using the credits purchase API
  const handleSubscribe = async (packageId) => {
    console.log('handleSubscribe called with packageId:', packageId);
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/login?redirect=${encodeURIComponent("/payment")}`);
      return;
    }

    // Don't allow subscribing to the current plan
    const selectedPlan = displayPlans.find(plan => plan.id === packageId || plan.packageId === packageId);
    if (selectedPlan && isCurrentPlan(selectedPlan.title)) {
      setError("You are already subscribed to this plan.");
      return;
    }

    setLoading(true);
    setLoadingPlanId(packageId);
    setError(null);

    try {
      // Find the selected plan by packageId
      console.log('Selected plan:', selectedPlan);
      
      if (!selectedPlan) {
        throw new Error("Invalid plan selected");
      }

      // If it's the free plan, show a message that it's automatically provided on signup
      if (packageId === "free-plan") {
        setError("The free plan with 400 credits is automatically provided when you sign up. No purchase needed.");
        setLoading(false);
        setLoadingPlanId(null);
        return;
      }

      // Create checkout session
      try {
        console.log('Creating checkout session for plan:', selectedPlan.title);
        
        // Use the credits purchase API to handle subscription checkout
        // Make sure we're sending the correct packageId that matches what's in the API
        const actualPackageId = selectedPlan.packageId || selectedPlan.id;
        
        const response = await fetch("/api/credits/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            packageId: actualPackageId,
            planTitle: selectedPlan.title
          }),
        });
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            throw new Error(`Failed to parse error response: ${errorText}`);
          }
          
          throw new Error(errorData.error || "Failed to initiate subscription");
        }

        const responseData = await response.json();
        console.log('API response data:', responseData);
        
        // Get checkout URL from response
        const { url } = responseData;
        
        if (!url) {
          throw new Error("No checkout URL returned from the server");
        }
        
        setLoading(false);
        setLoadingPlanId(null);
        
        // Open in a new tab
        console.log('Opening URL in new tab:', url);
        window.open(url, '_blank');
      } catch (fetchError) {
        console.error('Fetch error during subscription purchase:', fetchError);
        throw fetchError;
      }
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
      userSubscription.planName && 
      userSubscription.planName.toLowerCase() === planTitle.toLowerCase() &&
      (!userSubscription.status || userSubscription.status === "Active")
    );
  };

  // Predefined subscription plans
  // Define subscription plans with details
  const displayPlans = [
          {
            id: "free-plan",
            title: "Free Plan",
            description: "Try Before You Buy",
            price: "$0",
            frequency: "/month",
            features: [
              "400 credits (5 songs)",
              "Credits available upon signup",
              "Standard audio quality",
              "Basic usage rights",
              "Explore the platform"
            ],
            buttonText: "Start Free Trial",
            buttonVariant: "outline",
            buttonClassName:
              "bg-transparent text-white border-white/20 hover:bg-white/10 hover:border-white/30",
            mostPopular: false,
            packageId: "free-plan"
          },
          {
            id: "starter-plan",
            title: "Starter Plan",
            description: "Great for Beginners",
            price: "$10",
            frequency: "/month",
            features: [
              "20,000 credits (250 songs)",
              "Credits refresh monthly",
              "Standard audio quality",
              "Commercial usage rights",
              "Ideal for independent artists"
            ],
            buttonText: "Get Started",
            buttonVariant: "default",
            buttonClassName:
              "bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600",
            mostPopular: false,
            packageId: "prod_SQJRcw0CvcrPLc"
          },
          {
            id: "pro-plan",
            title: "Pro Plan",
            description: "For Serious Creators",
            price: "$20",
            frequency: "/month",
            features: [
              "40,000 credits (500 songs)",
              "Credits refresh monthly",
              "High audio quality",
              "Commercial usage rights",
              "Priority access",
              "Perfect for content creators"
            ],
            buttonText: "Upgrade to Pro",
            buttonVariant: "default",
            buttonClassName:
              "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600",
            mostPopular: true,
            packageId: "prod_SQJSScMORjkNzM"
          },
          {
            id: "premium-plan",
            title: "Premium Plan",
            description: "Studio-Level Access",
            price: "$30",
            frequency: "/month",
            features: [
              "80,000 credits (1,000 songs)",
              "Credits refresh monthly",
              "Highest audio quality",
              "Full commercial usage rights",
              "Priority support",
              "Best value per song"
            ],
            buttonText: "Go Premium",
            buttonVariant: "default",
            buttonClassName:
              "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600",
            mostPopular: false,
            packageId: "prod_SQJSZOlL876gkv"
          },
        ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 md:p-8">
      {/* Debug Test Button */}
      {/* <div className="max-w-7xl mx-auto mb-4">
        <Button 
          onClick={testStripeCheckout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        >
          Test Credit Purchase API
        </Button>
      </div> */}
      
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Title and Description */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400">
            Subscription Plans
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Choose the plan that&apos;s right for you. Start with our free credits, or
            subscribe to generate more music with our premium plans.
          </p>
        </div>
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 rounded-lg p-4 max-w-lg mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Current subscription notice */}
      {userSubscription && userSubscription.status === "Active" && (
        <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-purple-300">
            <CreditCard size={20} />
            <p>
              You&apos;re currently on the{" "}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 fade-in">
        {displayPlans && displayPlans.map((plan, index) => (
          <div
            key={index}
            className={cn(
              "fade-in-up",
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
              variant={isCurrentPlan(plan.title) ? "outline" : plan.buttonVariant}
              className={cn(
                "w-full py-3 sm:py-4 text-sm sm:text-base font-semibold",
                isCurrentPlan(plan.title) ? "bg-green-500/20 border-green-500/30 text-white" : plan.buttonClassName,
                "transition-all duration-300",
                "shadow-lg"
              )}
              disabled={isCurrentPlan(plan.title) || loading || (plan.packageId === "free-plan" && userSubscription?.planName)}
              onClick={() => handleSubscribe(plan.packageId)}
            >
              {loading && loadingPlanId === plan.packageId ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : isCurrentPlan(plan.title) ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Current Plan</span>
                </div>
              ) : plan.packageId === "free-plan" && userSubscription?.planName ? (
                "Downgrade Not Available"
              ) : (
                plan.buttonText || "Subscribe"
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Credits Usage Information */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl border border-white/10 max-w-3xl mx-auto mt-12">
        <h3 className="text-2xl font-semibold text-white mb-4">
          How Credits Work
        </h3>
        <div className="space-y-4 text-gray-300">
          <p>
            Credits are used to generate songs with our AI system. Our plans are designed to give you the best value:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              On average, each song requires about 80 credits to generate
            </li>
            <li>
              New users automatically receive 400 credits (approximately 5 songs)
            </li>
            <li>
              Our subscription plans provide monthly credits that refresh automatically
            </li>
            <li>
              Higher tier plans offer better value per song and additional features
            </li>
            <li>
              You can purchase additional credits anytime if you need more
            </li>
          </ul>
          <p>
            Your credit balance is visible in the top navigation bar, where you can also purchase more credits as needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
