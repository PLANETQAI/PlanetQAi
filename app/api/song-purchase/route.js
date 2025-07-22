import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/utils/email/emailService";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const { songId } = await req.json();
    if (!songId) {
      return new Response(JSON.stringify({ error: "Missing songId" }), {
        status: 400,
      });
    }
    // Fetch song
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || !song.isForSale) {
      return new Response(
        JSON.stringify({ error: "Song not found or not for sale" }),
        { status: 404 }
      );
    }
    // Calculate price (twice the creditsUsed)
    const price = (song.creditsUsed || 1) * 2;
    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || user.credits < price) {
      return new Response(JSON.stringify({ error: "Insufficient credits" }), {
        status: 402,
      });
    }
    // Check if already purchased
    const alreadyPurchased = await prisma.songPurchase.findFirst({
      where: { userId: user.id, songId: song.id },
    });
    if (alreadyPurchased) {
      return new Response(JSON.stringify({ error: "Already purchased" }), {
        status: 409,
      });
    }
    // Deduct credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: { decrement: price },
        totalCreditsUsed: { increment: price },
      },
    });
    // Log credit deduction
    await prisma.creditLog.create({
      data: {
        userId: user.id,
        amount: -price,
        balanceAfter: updatedUser.credits,
        description: `Purchased song: ${song.title}`,
        relatedEntityId: song.id,
        relatedEntityType: "SongPurchase",
      },
    });
    // Create purchase record
    await prisma.songPurchase.create({
      data: {
        userId: user.id,
        songId: song.id,
        price,
      },
    });

    // Send styled email with download link to buyer
    try {
      const downloadUrl = song.audioUrl;
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #fff; padding: 32px 0;">
          <div style="max-width: 480px; margin: 0 auto; background: #18181b; border-radius: 18px; box-shadow: 0 8px 32px #0002; padding: 32px 28px;">
            <div style="text-align:center; margin-bottom: 24px;">
              <img src="https://static.wixstatic.com/media/00e685_a95f74943ee7433d96f5732f10c0a711~mv2.png/v1/fill/w_1960,h_3692,al_t,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/00e685_a95f74943ee7433d96f5732f10c0a711~mv2.png" alt="Planet Q Productions" style="width: 80px; border-radius: 12px; margin-bottom: 8px;" />
              <h2 style="color: #06b6d4; font-size: 2rem; margin: 0;">Thank you for your purchase!</h2>
            </div>
            <p style="font-size: 1.1rem;">Hi <b>${
              user.fullName || user.email
            }</b>,</p>
            <p style="margin: 18px 0 10px 0;">You have successfully purchased <b>${
              song.title
            }</b>.</p>
            <div style="text-align:center; margin: 32px 0;">
              <a href="${downloadUrl}" style="display:inline-block;padding:16px 32px;background:linear-gradient(90deg,#06b6d4,#a21caf);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:1.1rem;box-shadow:0 2px 8px #06b6d488;">⬇️ Download your song</a>
            </div>
            <p style="color:#a1a1aa;font-size:14px;">If you have any issues, contact support or reply to this email.</p>
            <hr style="border:none;border-top:1px solid #27272a;margin:32px 0 16px 0;" />
            <div style="text-align:center;font-size:13px;color:#52525b;">© 2025 Planet Q Productions</div>
          </div>
        </div>
      `;
      await sendEmail({
        to: user.email,
        subject: `Your Song Purchase: ${song.title}`,
        html: emailHtml,
      });
    } catch (emailErr) {
      // Log but don't fail purchase if email fails
      console.error("Failed to send purchase email:", emailErr);
    }

    // Send confirmation/earnings email to song creator
    try {
      // Get creator
      const creator = await prisma.user.findUnique({
        where: { id: song.userId },
      });
      if (creator && creator.email) {
        // Get all purchases for this song
        const purchases = await prisma.songPurchase.findMany({
          where: { songId: song.id },
        });
        const totalCredits = purchases.reduce(
          (sum, p) => sum + (p.price || 0),
          0
        );
        // Convert credits to dollars (assuming 1 credit = $1, adjust as needed)
        const totalDollars = totalCredits.toFixed(2);
        const earningsHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #fff; padding: 32px 0;">
            <div style="max-width: 480px; margin: 0 auto; background: #18181b; border-radius: 18px; box-shadow: 0 8px 32px #0002; padding: 32px 28px;">
              <div style="text-align:center; margin-bottom: 24px;">
                <img src="https://static.wixstatic.com/media/00e685_a95f74943ee7433d96f5732f10c0a711~mv2.png/v1/fill/w_1960,h_3692,al_t,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/00e685_a95f74943ee7433d96f5732f10c0a711~mv2.png" alt="Planet Q Productions" style="width: 80px; border-radius: 12px; margin-bottom: 8px;" />
                <h2 style="color: #a21caf; font-size: 2rem; margin: 0;">Song Purchased!</h2>
              </div>
              <p style="font-size: 1.1rem;">Hi <b>${
                creator.fullName || creator.email
              }</b>,</p>
              <p style="margin: 18px 0 10px 0;">Your song <b>${
                song.title
              }</b> was just purchased.</p>
              <p style="margin: 10px 0 18px 0;">Total earnings for this song: <span style="color:#06b6d4;font-weight:bold;">$${totalDollars}</span></p>
              <p style="color:#a1a1aa;font-size:14px;">Keep creating and sharing your music on Planet Q Productions!</p>
              <hr style="border:none;border-top:1px solid #27272a;margin:32px 0 16px 0;" />
              <div style="text-align:center;font-size:13px;color:#52525b;">© 2025 Planet Q Productions</div>
            </div>
          </div>
        `;
        await sendEmail({
          to: creator.email,
          subject: `Your song was purchased: ${song.title}`,
          html: earningsHtml,
        });
      }
    } catch (creatorEmailErr) {
      console.error("Failed to send creator earnings email:", creatorEmailErr);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-16">
  {beats.map((beat) => {
    const isPurchased = purchasedSongs.includes(beat.id);
    return (
      <div key={beat.id} className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center">
        <Image
          src={beat.thumbnailUrl || "/images/radio/cover1.jpg"}
          alt={beat.title}
          width={220}
          height={220}
          className="rounded-xl mb-4 shadow-md object-cover"
        />
        <h2 className="text-2xl font-bold mb-2 text-cyan-300 text-center">{beat.title}</h2>
        <p className="text-gray-400 text-center mb-4">{beat.mood || beat.prompt || "No description."}</p>
        <div className="flex items-center justify-between w-full mt-auto">
          <span className="text-xl font-semibold text-purple-300">
            {beat.creditsUsed ? `$${(beat.creditsUsed * 2).toFixed(2)}` : "$2.00"}
          </span>
          <button
            className={`ml-4 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-full shadow-lg transition-transform ${purchasingId === beat.id ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}`}
            disabled={!beat.isForSale || isPurchased || purchasingId === beat.id}
            onClick={async () => {
              setPurchaseError(null);
              setPurchasingId(beat.id);
              try {
                const res = await fetch("/api/song-purchase", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ songId: beat.id }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setPurchaseError(data.error || "Purchase failed");
                } else {
                  setPurchasedSongs((prev) => [...prev, beat.id]);
                }
              } catch (err) {
                setPurchaseError("Network error. Try again.");
              } finally {
                setPurchasingId(null);
              }
            }}
          >
            {!beat.isForSale
              ? "Not for Sale"
              : isPurchased
              ? "Purchased"
              : purchasingId === beat.id
              ? "Processing..."
              : "Buy Now"}
          </button>
        </div>
        {purchaseError && purchasingId === beat.id && (
          <div className="text-red-400 text-sm mt-2">{purchaseError}</div>
        )}
      </div>
    );
  })}
</div>