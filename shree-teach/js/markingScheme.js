/**
 * SHREE TEACH - Configurable JEE Marking Scheme Engine
 * Dynamically computes marks for Single-correct, Multiple-correct (with Advanced partial marking),
 * and Numerical answer questions based on per-question configuration.
 */

export function evaluateQuestionScore(question, userAnswer) {
  const result = {
    isAttempted: false,
    isCorrect: false,
    isPartial: false,
    marksAwarded: 0,
    statusText: 'Unattempted'
  };

  const positiveMarks = Number(question.positiveMarks ?? 4);
  const negativeMarks = Number(question.negativeMarks ?? 1);

  // 1. Single-correct MCQ
  if (question.type === 'single_correct') {
    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
      result.isAttempted = false;
      result.marksAwarded = 0;
      result.statusText = 'Unattempted';
      return result;
    }

    result.isAttempted = true;
    if (Number(userAnswer) === Number(question.correctAnswer)) {
      result.isCorrect = true;
      result.marksAwarded = positiveMarks;
      result.statusText = 'Correct';
    } else {
      result.isCorrect = false;
      result.marksAwarded = -negativeMarks;
      result.statusText = 'Incorrect';
    }
    return result;
  }

  // 2. Multiple-correct (JEE Advanced)
  if (question.type === 'multiple_correct') {
    const userSelections = Array.isArray(userAnswer) ? userAnswer : [];
    if (userSelections.length === 0) {
      result.isAttempted = false;
      result.marksAwarded = 0;
      result.statusText = 'Unattempted';
      return result;
    }

    result.isAttempted = true;
    const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
    const correctSet = new Set(correctAnswers);
    const userSet = new Set(userSelections);

    // Check if any selected option is incorrect
    let hasIncorrectSelection = false;
    for (const opt of userSet) {
      if (!correctSet.has(opt)) {
        hasIncorrectSelection = true;
        break;
      }
    }

    if (hasIncorrectSelection) {
      // Negative marking applied
      result.isCorrect = false;
      result.marksAwarded = -negativeMarks;
      result.statusText = 'Incorrect (-' + negativeMarks + ')';
    } else {
      // No wrong options chosen!
      if (userSet.size === correctSet.size) {
        // All correct options chosen -> Full marks
        result.isCorrect = true;
        result.marksAwarded = positiveMarks;
        result.statusText = 'Full Marks';
      } else {
        // Partial marking
        result.isCorrect = true;
        result.isPartial = true;
        // In JEE Advanced: +1 mark for each correct option marked, if no incorrect option marked
        const partialPoints = userSet.size * 1;
        result.marksAwarded = Math.min(partialPoints, positiveMarks);
        result.statusText = `Partial (+${result.marksAwarded})`;
      }
    }
    return result;
  }

  // 3. Numerical question
  if (question.type === 'numerical') {
    if (userAnswer === null || userAnswer === undefined || userAnswer.toString().trim() === '') {
      result.isAttempted = false;
      result.marksAwarded = 0;
      result.statusText = 'Unattempted';
      return result;
    }

    result.isAttempted = true;
    const numUser = parseFloat(userAnswer);
    const numCorrect = parseFloat(question.correctAnswer);
    const tol = Number(question.tolerance ?? 0.05);

    if (!isNaN(numUser) && Math.abs(numUser - numCorrect) <= tol) {
      result.isCorrect = true;
      result.marksAwarded = positiveMarks;
      result.statusText = 'Correct';
    } else {
      result.isCorrect = false;
      result.marksAwarded = -negativeMarks;
      result.statusText = negativeMarks > 0 ? `Incorrect (-${negativeMarks})` : 'Incorrect (0)';
    }
    return result;
  }

  return result;
}

/**
 * Calculates comprehensive test result scores and statistics
 */
export function calculateTestResults(questions, answersMap, timeSpentMap = {}, testMeta = {}) {
  let totalScore = 0;
  let maxMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let partialCount = 0;

  const subjectStats = {};
  const chapterStats = {};
  const questionReviews = [];

  questions.forEach((q, index) => {
    const qMax = Number(q.positiveMarks ?? 4);
    maxMarks += qMax;

    const userAns = answersMap[q.id];
    const timeSpent = timeSpentMap[q.id] || 0;
    const evalResult = evaluateQuestionScore(q, userAns);

    totalScore += evalResult.marksAwarded;

    if (!evalResult.isAttempted) {
      unattemptedCount++;
    } else if (evalResult.isPartial) {
      partialCount++;
      correctCount++;
    } else if (evalResult.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    // Subject breakdown
    const subj = q.subject || 'General';
    if (!subjectStats[subj]) {
      subjectStats[subj] = {
        name: subj,
        score: 0,
        maxMarks: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        timeSpentSeconds: 0,
        totalQuestions: 0
      };
    }
    subjectStats[subj].score += evalResult.marksAwarded;
    subjectStats[subj].maxMarks += qMax;
    subjectStats[subj].totalQuestions++;
    subjectStats[subj].timeSpentSeconds += timeSpent;
    if (!evalResult.isAttempted) subjectStats[subj].unattempted++;
    else if (evalResult.isCorrect) subjectStats[subj].correct++;
    else subjectStats[subj].incorrect++;

    // Chapter breakdown
    const chap = q.chapter || 'Misc';
    if (!chapterStats[chap]) {
      chapterStats[chap] = {
        chapter: chap,
        subject: subj,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        total: 0
      };
    }
    chapterStats[chap].total++;
    if (!evalResult.isAttempted) chapterStats[chap].unattempted++;
    else if (evalResult.isCorrect) chapterStats[chap].correct++;
    else chapterStats[chap].incorrect++;

    questionReviews.push({
      question: q,
      index: index + 1,
      userAnswer: userAns,
      evalResult,
      timeSpentSeconds: timeSpent
    });
  });

  // Calculate subject accuracies
  Object.keys(subjectStats).forEach(s => {
    const attempted = subjectStats[s].correct + subjectStats[s].incorrect;
    subjectStats[s].accuracy = attempted > 0 ? Math.round((subjectStats[s].correct / attempted) * 100) : 0;
    subjectStats[s].percentage = subjectStats[s].maxMarks > 0 ? Math.round((subjectStats[s].score / subjectStats[s].maxMarks) * 100) : 0;
  });

  const totalAttempted = correctCount + incorrectCount;
  const overallAccuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
  const overallPercentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

  return {
    totalScore,
    maxMarks,
    percentage: overallPercentage,
    accuracy: overallAccuracy,
    correctCount,
    incorrectCount,
    unattemptedCount,
    partialCount,
    totalQuestions: questions.length,
    subjectStats,
    chapterStats,
    questionReviews,
    testMeta
  };
}
