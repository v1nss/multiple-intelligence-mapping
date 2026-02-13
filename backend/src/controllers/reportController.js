import { Assessment, User, AssessmentVersion } from '../models/index.js';
import { getAssessmentResults } from '../services/scoringService.js';
import { generatePDFReport } from '../utils/pdfGenerator.js';

/**
 * GET /assessments/:id/report
 */
export const downloadReport = async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'gender', 'birthdate'] },
        { model: AssessmentVersion, as: 'version', attributes: ['version_name'] },
      ],
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.status !== 'completed') return res.status(400).json({ error: 'Assessment not yet completed' });

    const results = await getAssessmentResults(assessment.id);
    if (!results) return res.status(404).json({ error: 'No results found' });

    const studentInfo = {
      first_name: assessment.user.first_name,
      last_name: assessment.user.last_name,
      email: assessment.user.email,
      gender: assessment.user.gender,
      birthdate: assessment.user.birthdate,
    };

    const pdfBuffer = await generatePDFReport(studentInfo, results, {
      version_name: assessment.version.version_name,
      completed_at: assessment.completed_at,
    });

    const filename = `MIM_Report_${assessment.user.last_name}_${assessment.user.first_name}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
