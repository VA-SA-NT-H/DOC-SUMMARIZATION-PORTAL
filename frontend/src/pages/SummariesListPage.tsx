// SummariesListPage.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import SummaryCard from '../components/SummaryCard';
import { apiService } from '../services/api';
import { useParams } from 'react-router-dom';

export default function SummariesListPage() {
  const { id } = useParams<{ id: string }>();
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiService.getDocumentSummaries(id)
      .then(res => setSummaries(res))
      .catch(e => setErr(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CircularProgress />;
  if (err) return <Alert severity="error">{err}</Alert>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>All Summaries</Typography>
      {summaries.length === 0 && <Alert severity="info">No summaries yet for this document.</Alert>}
      {summaries.map(s => (
        <SummaryCard key={s.summaryId} summary={s} />
        ))}
    </Box>
  );
}
