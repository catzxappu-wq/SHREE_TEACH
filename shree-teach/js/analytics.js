/**
 * SHREE TEACH - JEE Performance Analytics & Rank / Percentile Simulator
 * IMPORTANT DISCLAIMER:
 * Percentile and Rank calculations are UNOFFICIAL PRACTICE ESTIMATES based on historical
 * score vs percentile distributions from past JEE trends.
 * They are intended solely for diagnostic practice guidance, NOT official NTA/IIT JEE results.
 */

export function simulatePercentileAndRank(score, maxMarks = 300, examType = 'JEE Main') {
  // Normalize score to 300-point scale for JEE Main
  const normalizedScore = (score / maxMarks) * 300;

  if (examType === 'JEE Advanced') {
    // Advanced percentage based estimation
    const advPercentage = (score / maxMarks) * 100;
    if (advPercentage >= 70) {
      return {
        percentile: "Top 0.5% (Elite)",
        rankEstimate: "1 - 500 (IIT Top Branches)",
        zone: "Exceptional / Top IITs",
        advice: "Outstanding performance! You are in prime contention for Top 5 IITs Computer Science & Electrical branches."
      };
    } else if (advPercentage >= 55) {
      return {
        percentile: "Top 2%",
        rankEstimate: "501 - 2,500 (Old IITs Core Branches)",
        zone: "Strong / IIT Qualified",
        advice: "Very strong standing. Reinforce multi-concept mixed questions to push into Top 1000."
      };
    } else if (advPercentage >= 40) {
      return {
        percentile: "Top 5%",
        rankEstimate: "2,501 - 7,000 (IIT Qualified)",
        zone: "Competitive IIT Zone",
        advice: "Solid preparation. Focus on reducing negative marks in Multi-Correct questions."
      };
    } else if (advPercentage >= 30) {
      return {
        percentile: "Top 10%",
        rankEstimate: "7,001 - 15,000 (IIT Borderline/New IITs)",
        zone: "Borderline IIT Zone",
        advice: "Target your highest scoring subject and strengthen fundamental problem sets."
      };
    } else {
      return {
        percentile: "Below Qualifying",
        rankEstimate: "15,000+ (Needs Conceptual Revisit)",
        zone: "Practice Required",
        advice: "Deep dive into high-weightage chapters and practice single-choice questions thoroughly."
      };
    }
  }

  // JEE Main Normative Curves (Approximate historical brackets)
  let percentileRange = "";
  let rankRange = "";
  let zone = "";
  let advice = "";

  if (normalizedScore >= 260) {
    percentileRange = "99.85 - 99.98 %ile";
    rankRange = "150 - 1,500";
    zone = "Elite (NIT Trichy / Surathkal / Warangal CSE Zone)";
    advice = "Extraordinary mastery! Keep your exam temperament steady and focus on maintaining speed with 100% accuracy.";
  } else if (normalizedScore >= 220) {
    percentileRange = "99.30 - 99.80 %ile";
    rankRange = "1,800 - 6,500";
    zone = "Top Tier NITs / IIITs (Top Branches)";
    advice = "Superb score! You have strong grasp over core concepts. Iron out minor silly mistakes in numericals.";
  } else if (normalizedScore >= 180) {
    percentileRange = "98.20 - 99.25 %ile";
    rankRange = "7,000 - 16,000";
    zone = "Established NITs / Top Engineering Colleges";
    advice = "Strong foundation! Pushing 20-30 more marks will comfortably put you in the elite 99+ percentile club.";
  } else if (normalizedScore >= 150) {
    percentileRange = "96.50 - 98.10 %ile";
    rankRange = "18,000 - 35,000";
    zone = "NIT / State Top College Qualified";
    advice = "Decent performance, but accuracy is leaking marks. Prioritize reviewing incorrect questions before new tests.";
  } else if (normalizedScore >= 120) {
    percentileRange = "93.00 - 96.40 %ile";
    rankRange = "38,000 - 75,000";
    zone = "Qualified for JEE Advanced cutoff";
    advice = "Good baseline. Identify chapters where unattempted count was high and build chapter confidence.";
  } else if (normalizedScore >= 90) {
    percentileRange = "88.00 - 92.90 %ile";
    rankRange = "80,000 - 1,30,000";
    zone = "Cutoff Threshold Zone";
    advice = "Focus on high-yield formulas and physical chemistry / standard mechanics problems to jump into the 95+ bracket.";
  } else {
    percentileRange = "Below 85.00 %ile";
    rankRange = "1,50,000+";
    zone = "Foundation Building Required";
    advice = "Step back from full mocks and practice topic-wise single-correct questions first.";
  }

  return {
    percentile: percentileRange,
    rankEstimate: rankRange,
    zone,
    advice,
    isUnofficialDisclaimer: "Unofficial practice estimate based on historical trends & normalisation curves. Not an official NTA/IIT JEE scorecard."
  };
}

/**
 * Diagnostic analysis across subjects and chapters
 */
export function generateDiagnosticInsights(subjectStats, chapterStats) {
  const subjects = Object.values(subjectStats || {});
  
  // Sort subjects by accuracy
  const sortedSubjects = [...subjects].sort((a, b) => b.accuracy - a.accuracy);
  const strongSubjects = sortedSubjects.filter(s => s.accuracy >= 75);
  const weakSubjects = sortedSubjects.filter(s => s.accuracy < 60);

  // Chapters analysis
  const chapters = Object.values(chapterStats || {});
  const weakChapters = chapters.filter(c => {
    const attempted = c.correct + c.incorrect;
    return attempted > 0 && (c.correct / attempted) < 0.6;
  });
  const strongChapters = chapters.filter(c => {
    const attempted = c.correct + c.incorrect;
    return attempted > 0 && (c.correct / attempted) >= 0.75;
  });

  // Actionable diagnostic summary text
  let summaryText = "";
  if (sortedSubjects.length >= 2) {
    const best = sortedSubjects[0];
    const worst = sortedSubjects[sortedSubjects.length - 1];
    if (best.accuracy - worst.accuracy >= 20) {
      summaryText = `Your ${best.name} accuracy (${best.accuracy}%) is strong, but your ${worst.name} performance (${worst.accuracy}%) needs targeted revision and question drills.`;
    } else {
      summaryText = `Your subject preparation is relatively balanced across ${sortedSubjects.map(s => s.name).join(', ')}. Focus on time efficiency in lengthy calculations.`;
    }
  } else {
    summaryText = "Solid sectional attempt! Review weak chapters to solidify concept clarity.";
  }

  // Recommended chapters to practice next
  const recommendedNext = weakChapters.length > 0 
    ? weakChapters.slice(0, 4).map(c => c.chapter)
    : ["Rotational Motion", "Thermodynamics", "Chemical Bonding", "Definite Integration"];

  return {
    summaryText,
    strongSubjects: strongSubjects.map(s => s.name),
    weakSubjects: weakSubjects.map(s => s.name),
    strongChapters: strongChapters.map(c => c.chapter),
    weakChapters: weakChapters.map(c => c.chapter),
    recommendedNext
  };
}
