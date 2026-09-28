import { jsPDF } from 'jspdf';
import {
  COMPREHENSIVE_QUIZ_QUESTIONS,
  EnvironmentalParams,
  LEARNING_MODULES,
  StudentObservation,
} from '../data/simulationData';
import { SimulationMetrics } from './simulationMath';

export interface ForensicPdfReportInput {
  studentName: string;
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  caseConclusionPmi: string;
  casePrimaryFactor: string;
  completedStepsCount: number;
  inspectedObjectCount: number;
  examinedEvidenceCount: number;
  completedModuleCount: number;
  observations: StudentObservation[];
  quizAnswers: Record<string, number>;
}

export function exportForensicDossierPdf(input: ForensicPdfReportInput): void {
  const {
    studentName,
    params,
    metrics,
    caseConclusionPmi,
    casePrimaryFactor,
    completedStepsCount,
    inspectedObjectCount,
    examinedEvidenceCount,
    completedModuleCount,
    observations,
    quizAnswers,
  } = input;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Calculate Quiz Score
  const totalQuestions = COMPREHENSIVE_QUIZ_QUESTIONS.length;
  const answeredCount = Object.keys(quizAnswers).length;
  const correctQuizCount = COMPREHENSIVE_QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);
  const quizPercent = Math.round((correctQuizCount / totalQuestions) * 100);

  // =========================================================================
  // HEADER BANNER
  // =========================================================================
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(34, 211, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    'FORENSIM.IO · CORDILLERA FORENSIC SIMULATION LABORATORY (1,540m ASL)',
    margin,
    11
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(
    'Baguio Indoor Simulation Case — Official Forensic Dossier',
    margin,
    19
  );

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Researcher: ${studentName || 'Forensic Science Researcher'}   |   Case File: #BGY-2026-09   |   Generated: ${new Date().toLocaleString()}`,
    margin,
    27
  );

  y = 42;

  // =========================================================================
  // SECTION 1: EXECUTIVE SCORE & SIMULATION TELEMETRY SUMMARY
  // =========================================================================
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    '1. Active Biophysical Simulation & Assessment Summary',
    margin,
    y
  );
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text('SIMULATION TIMELINE & BIOPHYSICS', margin + 4, y + 6);
  doc.text('CHAMBER MICRO-CLIMATE & COMPLETION', margin + 96, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const leftLines = [
    `Simulation Time: Day ${metrics.simDay.toFixed(1)} (${metrics.elapsedHours}h) · ${metrics.add} ADD`,
    `Active Stage: ${metrics.currentStage.title}`,
    `Core Body Temp: ${metrics.coreBodyTempC}°C (Delta: ${metrics.algorMortisDeltaC >= 0 ? '+' : ''}${metrics.algorMortisDeltaC}°C)`,
    `Rigor Mortis: ${metrics.rigorMortisPercent}% (${metrics.rigorPhaseLabel})`,
    `Livor Fixation: ${metrics.livorMortisFixationPercent}% · Gas: +${metrics.gasPressureKpa} kPa · Purge: ${metrics.purgeFluidMl} mL`,
  ];
  leftLines.forEach((line, idx) => {
    doc.text(line, margin + 4, y + 12 + idx * 5.2);
  });

  const rightLines = [
    `Climate: ${params.temperature.toFixed(1)}°C · ${params.humidity}% RH · ${params.airflow.toFixed(2)} m/s`,
    `Enclosure: ${params.roomCondition} (${params.lightExposure} Lux)`,
    `Biomass Retained: ${metrics.massRetentionPercent}% · VOC: ${metrics.vocPpm} ppm`,
    `Megyesi TBS: ${metrics.megyesiTbs}/35 pts · Matrix pH: ${metrics.matrixPh}`,
    `Competency Quiz Score: ${correctQuizCount} / ${totalQuestions} (${quizPercent}%) · ${completedStepsCount}/8 Steps`,
  ];
  rightLines.forEach((line, idx) => {
    doc.text(line, margin + 96, y + 12 + idx * 5.2);
  });

  y += 45;

  // =========================================================================
  // SECTION 2: CASE CONCLUSIONS & PROTOCOL VERIFICATION
  // =========================================================================
  checkPageBreak(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Researcher Case Conclusions & Protocol Verification', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const pmiLines = doc.splitTextToSize(
    `• Estimated PMI / ADD Trajectory Conclusion: ${caseConclusionPmi}`,
    contentWidth
  );
  doc.text(pmiLines, margin, y);
  y += pmiLines.length * 4.5 + 1.5;

  const factorLines = doc.splitTextToSize(
    `• Primary Governing Environmental Factor: ${casePrimaryFactor}`,
    contentWidth
  );
  doc.text(factorLines, margin, y);
  y += factorLines.length * 4.5 + 1.5;

  doc.text(
    `• Lab Milestones: ${completedStepsCount}/8 Protocol Steps | ${inspectedObjectCount}/10 Chamber Nodes | ${examinedEvidenceCount}/7 Evidence Logs | ${completedModuleCount}/${LEARNING_MODULES.length} Modules`,
    margin,
    y
  );
  y += 8;

  // =========================================================================
  // SECTION 3: SCIENTIFIC OBSERVATION LOG
  // =========================================================================
  checkPageBreak(24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `3. Recorded Scientific Observations (${observations.length} Entries)`,
    margin,
    y
  );
  y += 5;

  if (observations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No custom observations logged during this session.', margin, y);
    y += 7;
  } else {
    observations.forEach((obs, idx) => {
      const combinedNotes = `Observed Changes: ${obs.observedChanges} | Evidence: ${obs.evidenceNotes} | Interpretation: ${obs.studentInterpretation}`;
      const noteWrapped = doc.splitTextToSize(combinedNotes, contentWidth - 8);
      const boxH = 11 + noteWrapped.length * 4.2;
      checkPageBreak(boxH + 4);

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(252, 253, 255);
      doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `#${idx + 1} · ${obs.observationDate}   [Day ${obs.simulationDay.toFixed(1)} | ${obs.addValue} ADD | ${obs.stageName} | ${obs.environmentalConditions.temperature}°C, ${obs.environmentalConditions.humidity}% RH]`,
        margin + 3,
        y + 5.5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(noteWrapped, margin + 3, y + 10.2);

      y += boxH + 3;
    });
    y += 3;
  }

  // =========================================================================
  // SECTION 4: COMPETENCY QUIZ SCORE & COMPLETE ANSWER KEY BREAKDOWN
  // =========================================================================
  checkPageBreak(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `4. Competency Quiz Score & Answer Key (${correctQuizCount} / ${totalQuestions} Correct · ${quizPercent}%)`,
    margin,
    y
  );
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Answered: ${answeredCount} of ${totalQuestions} questions   |   Correct: ${correctQuizCount}   |   Score Percentage: ${quizPercent}%`,
    margin,
    y
  );
  y += 5.5;

  COMPREHENSIVE_QUIZ_QUESTIONS.forEach((q, idx) => {
    const pickedIdx = quizAnswers[q.id];
    const hasAnswered = pickedIdx !== undefined;
    const isCorrect = pickedIdx === q.correctIndex;

    const studentAnswerText = hasAnswered
      ? q.options[pickedIdx]
      : 'Not Answered';
    const correctAnswerText = q.options[q.correctIndex];

    const qLines = doc.splitTextToSize(
      `Q${idx + 1}. ${q.question}`,
      contentWidth - 8
    );
    const studentLines = doc.splitTextToSize(
      `Your Answer: ${studentAnswerText} (${hasAnswered ? (isCorrect ? 'CORRECT' : 'INCORRECT') : 'UNANSWERED'})`,
      contentWidth - 8
    );
    const correctLines = doc.splitTextToSize(
      `Correct Answer: ${correctAnswerText}`,
      contentWidth - 8
    );
    const expLines = doc.splitTextToSize(
      `Explanation: ${q.explanation}`,
      contentWidth - 8
    );

    const cardHeight =
      7 +
      (qLines.length +
        studentLines.length +
        correctLines.length +
        expLines.length) *
        4.0;
    checkPageBreak(cardHeight + 4);

    doc.setDrawColor(isCorrect ? 167 : 203, isCorrect ? 243 : 213, isCorrect ? 208 : 225);
    doc.setFillColor(isCorrect ? 240 : 248, isCorrect ? 253 : 250, isCorrect ? 244 : 252);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

    let cy = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(qLines, margin + 3, cy);
    cy += qLines.length * 4.0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (isCorrect) {
      doc.setTextColor(5, 150, 105);
    } else if (hasAnswered) {
      doc.setTextColor(225, 29, 72);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(studentLines, margin + 3, cy);
    cy += studentLines.length * 4.0;

    doc.setTextColor(4, 120, 87);
    doc.text(correctLines, margin + 3, cy);
    cy += correctLines.length * 4.0;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(expLines, margin + 3, cy);

    y += cardHeight + 3;
  });

  // Add page numbers at bottom of all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ForenSim.io · Baguio City Highland Forensic Simulation Dossier · Page ${p} of ${totalPages}`,
      margin,
      pageHeight - 8
    );
  }

  const safeDay = metrics.simDay.toFixed(1).replace('.', '-');
  doc.save(`ForenSim-Dossier-Day-${safeDay}.pdf`);
}
