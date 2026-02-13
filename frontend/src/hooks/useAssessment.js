import { useState, useCallback } from 'react';
import { assessmentService } from '../services/assessmentService.js';

export function useAssessment() {
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startAssessment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.startAssessment();
      setAssessment(data.assessment);
      return data.assessment;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to start assessment';
      setError(msg);
      // If there's already an in-progress assessment, return its id
      if (err.response?.data?.assessment_id) {
        return { id: err.response.data.assessment_id, existing: true };
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getQuestions(assessmentId);
      setQuestions(data.questions);
      return data.questions;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load questions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAssessment = useCallback(async (assessmentId, responses) => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.submitAssessment(assessmentId, responses);
      setResults(data.results);
      return data.results;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit assessment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResult = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getResult(assessmentId);
      setResults(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load results');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getHistory();
      setHistory(data.assessments);
      return data.assessments;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadReport = useCallback(async (assessmentId) => {
    try {
      const blob = await assessmentService.downloadReport(assessmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MIM_Report_${assessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to download report');
      throw err;
    }
  }, []);

  return {
    assessment,
    questions,
    results,
    history,
    loading,
    error,
    startAssessment,
    fetchQuestions,
    submitAssessment,
    fetchResult,
    fetchHistory,
    downloadReport,
  };
}
