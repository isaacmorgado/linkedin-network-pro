/**
 * Document Export Service
 *
 * Exports resumes and cover letters to PDF and DOCX formats
 */

import type { GeneratedResume } from '../types/resume';
import type { CoverLetter } from '../types/cover-letter';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'pdf' | 'docx';

export interface ExportOptions {
  format: ExportFormat;
  fileName?: string;
  includeHeader?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  format: ExportFormat;
  fileSize?: number;
  error?: string;
}

// ============================================================================
// RESUME EXPORT
// ============================================================================

/**
 * Export resume to PDF or DOCX
 */
export async function exportResume(
  resume: GeneratedResume,
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = Date.now();
  const fileName = options.fileName || `Resume_${resume.jobTitle}_${Date.now()}`;

  log.info(LogCategory.SERVICE, 'Exporting resume', {
    format: options.format,
    fileName,
    jobTitle: resume.jobTitle,
  });

  try {
    if (options.format === 'pdf') {
      return await exportResumeToPDF(resume, { ...options, fileName });
    } else {
      return await exportResumeToDOCX(resume, { ...options, fileName });
    }
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Resume export failed', error as Error);
    return {
      success: false,
      fileName,
      format: options.format,
      error: (error as Error).message,
    };
  }
}

/**
 * Export resume to PDF using jsPDF
 */
async function exportResumeToPDF(
  resume: GeneratedResume,
  options: ExportOptions
): Promise<ExportResult> {
  // Dynamic import jsPDF (only load when needed)
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 8.5" x 11"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Font settings
  const fontFamily = options.fontFamily || 'helvetica';
  const baseFontSize = options.fontSize || 11;

  // Helper: Add text with wrapping
  const addText = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' = 'normal',
    indent: number = 0
  ) => {
    doc.setFont(fontFamily, fontStyle);
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = fontSize * 1.2;

    lines.forEach((line: string) => {
      // Check if we need a new page
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(line, margin + indent, yPosition);
      yPosition += lineHeight;
    });
  };

  // Helper: Add spacing
  const addSpacing = (space: number) => {
    yPosition += space;
  };

  // Header - Name and Contact
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(20);
  doc.text(resume.personalInfo.fullName, margin, yPosition);
  yPosition += 24;

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(10);
  const contactInfo = [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
  ]
    .filter(Boolean)
    .join(' • ');
  doc.text(contactInfo, margin, yPosition);
  yPosition += 20;

  // Professional Summary
  if (resume.professionalSummary) {
    addText('PROFESSIONAL SUMMARY', 14, 'bold');
    addSpacing(8);
    addText(resume.professionalSummary, baseFontSize);
    addSpacing(16);
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    addText('EXPERIENCE', 14, 'bold');
    addSpacing(8);

    resume.experience.forEach((exp) => {
      // Job title and company
      addText(`${exp.title} | ${exp.company}`, baseFontSize, 'bold');
      addSpacing(4);

      // Dates and location
      const dates = `${exp.startDate} - ${exp.endDate || 'Present'}`;
      const location = exp.location || '';
      addText(`${dates}${location ? ' • ' + location : ''}`, baseFontSize - 1);
      addSpacing(6);

      // Responsibilities/Achievements
      if (exp.description) {
        addText(exp.description, baseFontSize, 'normal', 10);
        addSpacing(4);
      }

      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach((achievement) => {
          addText(`• ${achievement}`, baseFontSize, 'normal', 10);
        });
      }

      addSpacing(12);
    });
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    addText('SKILLS', 14, 'bold');
    addSpacing(8);
    addText(resume.skills.join(' • '), baseFontSize);
    addSpacing(16);
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    addText('EDUCATION', 14, 'bold');
    addSpacing(8);

    resume.education.forEach((edu) => {
      addText(
        `${edu.degree} in ${edu.fieldOfStudy}`,
        baseFontSize,
        'bold'
      );
      addSpacing(4);
      addText(
        `${edu.institution}${edu.graduationDate ? ' • ' + edu.graduationDate : ''}`,
        baseFontSize - 1
      );
      if (edu.gpa) {
        addSpacing(4);
        addText(`GPA: ${edu.gpa}`, baseFontSize - 1);
      }
      addSpacing(12);
    });
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    addText('PROJECTS', 14, 'bold');
    addSpacing(8);

    resume.projects.forEach((project) => {
      addText(project.name, baseFontSize, 'bold');
      addSpacing(4);
      if (project.description) {
        addText(project.description, baseFontSize, 'normal', 10);
      }
      if (project.technologies && project.technologies.length > 0) {
        addSpacing(4);
        addText(
          `Technologies: ${project.technologies.join(', ')}`,
          baseFontSize - 1,
          'normal',
          10
        );
      }
      addSpacing(12);
    });
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    addText('CERTIFICATIONS', 14, 'bold');
    addSpacing(8);

    resume.certifications.forEach((cert) => {
      addText(`• ${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}`, baseFontSize);
      if (cert.date) {
        addSpacing(2);
        addText(`  Issued: ${cert.date}`, baseFontSize - 1);
      }
      addSpacing(6);
    });
  }

  // Save PDF
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  log.info(LogCategory.SERVICE, 'Resume exported to PDF successfully', {
    fileName: options.fileName,
    fileSize: blob.size,
  });

  return {
    success: true,
    fileName: `${options.fileName}.pdf`,
    format: 'pdf',
    fileSize: blob.size,
  };
}

/**
 * Export resume to DOCX using docx library
 */
async function exportResumeToDOCX(
  resume: GeneratedResume,
  options: ExportOptions
): Promise<ExportResult> {
  // Dynamic import docx (only load when needed)
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import(
    'docx'
  );

  const sections = [];

  // Helper: Create heading
  const createHeading = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 100 },
    });

  // Helper: Create subheading
  const createSubheading = (text: string, bold = true) =>
    new Paragraph({
      children: [new TextRun({ text, bold, size: 22 })],
      spacing: { before: 100, after: 50 },
    });

  // Helper: Create body text
  const createBodyText = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 20 })],
      spacing: { after: 80 },
    });

  // Helper: Create bullet point
  const createBullet = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 20 })],
      bullet: { level: 0 },
      spacing: { after: 40 },
    });

  const children = [];

  // Header - Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resume.personalInfo.fullName,
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact Info
  const contactInfo = [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
  ]
    .filter(Boolean)
    .join(' • ');
  children.push(
    new Paragraph({
      children: [new TextRun({ text: contactInfo, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Professional Summary
  if (resume.professionalSummary) {
    children.push(createHeading('PROFESSIONAL SUMMARY'));
    children.push(createBodyText(resume.professionalSummary));
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    children.push(createHeading('EXPERIENCE'));

    resume.experience.forEach((exp) => {
      children.push(createSubheading(`${exp.title} | ${exp.company}`));

      const dates = `${exp.startDate} - ${exp.endDate || 'Present'}`;
      const location = exp.location || '';
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${dates}${location ? ' • ' + location : ''}`,
              size: 18,
              italics: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      if (exp.description) {
        children.push(createBodyText(exp.description));
      }

      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach((achievement) => {
          children.push(createBullet(achievement));
        });
      }
    });
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    children.push(createHeading('SKILLS'));
    children.push(createBodyText(resume.skills.join(' • ')));
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    children.push(createHeading('EDUCATION'));

    resume.education.forEach((edu) => {
      children.push(createSubheading(`${edu.degree} in ${edu.fieldOfStudy}`));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.institution}${edu.graduationDate ? ' • ' + edu.graduationDate : ''}`,
              size: 18,
              italics: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      if (edu.gpa) {
        children.push(createBodyText(`GPA: ${edu.gpa}`));
      }
    });
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    children.push(createHeading('PROJECTS'));

    resume.projects.forEach((project) => {
      children.push(createSubheading(project.name));
      if (project.description) {
        children.push(createBodyText(project.description));
      }
      if (project.technologies && project.technologies.length > 0) {
        children.push(
          createBodyText(`Technologies: ${project.technologies.join(', ')}`)
        );
      }
    });
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(createHeading('CERTIFICATIONS'));

    resume.certifications.forEach((cert) => {
      children.push(
        createBullet(`${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}`)
      );
      if (cert.date) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Issued: ${cert.date}`, size: 18 })],
            indent: { left: 360 },
            spacing: { after: 40 },
          })
        );
      }
    });
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  // Generate blob and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.fileName}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  log.info(LogCategory.SERVICE, 'Resume exported to DOCX successfully', {
    fileName: options.fileName,
    fileSize: blob.size,
  });

  return {
    success: true,
    fileName: `${options.fileName}.docx`,
    format: 'docx',
    fileSize: blob.size,
  };
}

// ============================================================================
// COVER LETTER EXPORT
// ============================================================================

/**
 * Export cover letter to PDF or DOCX
 */
export async function exportCoverLetter(
  coverLetter: CoverLetter,
  options: ExportOptions
): Promise<ExportResult> {
  const fileName =
    options.fileName || `CoverLetter_${coverLetter.company}_${Date.now()}`;

  log.info(LogCategory.SERVICE, 'Exporting cover letter', {
    format: options.format,
    fileName,
    company: coverLetter.company,
  });

  try {
    if (options.format === 'pdf') {
      return await exportCoverLetterToPDF(coverLetter, { ...options, fileName });
    } else {
      return await exportCoverLetterToDOCX(coverLetter, { ...options, fileName });
    }
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Cover letter export failed', error as Error);
    return {
      success: false,
      fileName,
      format: options.format,
      error: (error as Error).message,
    };
  }
}

/**
 * Export cover letter to PDF
 */
async function exportCoverLetterToPDF(
  coverLetter: CoverLetter,
  options: ExportOptions
): Promise<ExportResult> {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 72; // 1 inch
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const fontFamily = options.fontFamily || 'times';
  const fontSize = options.fontSize || 12;
  const lineHeight = fontSize * 1.5;

  // Helper: Add paragraph
  const addParagraph = (text: string) => {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    yPosition += lineHeight; // Extra spacing between paragraphs
  };

  // Header - Candidate info
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(fontSize);
  doc.text(coverLetter.content.candidateName, margin, yPosition);
  yPosition += lineHeight;
  if (coverLetter.content.candidateEmail) {
    doc.text(coverLetter.content.candidateEmail, margin, yPosition);
    yPosition += lineHeight;
  }
  if (coverLetter.content.candidatePhone) {
    doc.text(coverLetter.content.candidatePhone, margin, yPosition);
    yPosition += lineHeight;
  }
  if (coverLetter.content.candidateAddress) {
    doc.text(coverLetter.content.candidateAddress, margin, yPosition);
    yPosition += lineHeight;
  }
  yPosition += lineHeight;

  // Date
  doc.text(coverLetter.content.date, margin, yPosition);
  yPosition += lineHeight * 2;

  // Recipient
  doc.text(coverLetter.content.hiringManagerName || 'Hiring Manager', margin, yPosition);
  yPosition += lineHeight;
  doc.text(coverLetter.content.companyName, margin, yPosition);
  yPosition += lineHeight * 2;

  // Body
  addParagraph(coverLetter.content.greeting);
  addParagraph(coverLetter.content.opening);
  addParagraph(coverLetter.content.body1);
  addParagraph(coverLetter.content.body2);
  addParagraph(coverLetter.content.closing);

  // Signature
  yPosition += lineHeight;
  doc.text(coverLetter.content.signature, margin, yPosition);
  yPosition += lineHeight;
  doc.text(coverLetter.content.candidateName, margin, yPosition);

  // Save
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    fileName: `${options.fileName}.pdf`,
    format: 'pdf',
    fileSize: blob.size,
  };
}

/**
 * Export cover letter to DOCX
 */
async function exportCoverLetterToDOCX(
  coverLetter: CoverLetter,
  options: ExportOptions
): Promise<ExportResult> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');

  const children = [];

  // Header - Candidate info
  children.push(
    new Paragraph({
      children: [new TextRun({ text: coverLetter.content.candidateName, size: 22 })],
      spacing: { after: 40 },
    })
  );
  if (coverLetter.content.candidateEmail) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: coverLetter.content.candidateEmail, size: 20 })],
        spacing: { after: 40 },
      })
    );
  }
  if (coverLetter.content.candidatePhone) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: coverLetter.content.candidatePhone, size: 20 })],
        spacing: { after: 40 },
      })
    );
  }
  if (coverLetter.content.candidateAddress) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: coverLetter.content.candidateAddress, size: 20 })],
        spacing: { after: 40 },
      })
    );
  }
  children.push(
    new Paragraph({
      text: '',
      spacing: { after: 200 },
    })
  );

  // Date
  children.push(
    new Paragraph({
      children: [new TextRun({ text: coverLetter.content.date, size: 20 })],
      spacing: { after: 200 },
    })
  );

  // Recipient
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: coverLetter.content.hiringManagerName || 'Hiring Manager',
          size: 20,
        }),
      ],
      spacing: { after: 40 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: coverLetter.content.companyName, size: 20 })],
      spacing: { after: 200 },
    })
  );

  // Body paragraphs
  const paragraphs = [
    coverLetter.content.greeting,
    coverLetter.content.opening,
    coverLetter.content.body1,
    coverLetter.content.body2,
    coverLetter.content.closing,
  ];

  paragraphs.forEach((text) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text, size: 22 })],
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT,
      })
    );
  });

  // Signature
  children.push(
    new Paragraph({
      text: '',
      spacing: { after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: coverLetter.content.signature, size: 22 })],
      spacing: { after: 40 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: coverLetter.content.candidateName, size: 22 })],
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.fileName}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    fileName: `${options.fileName}.docx`,
    format: 'docx',
    fileSize: blob.size,
  };
}
