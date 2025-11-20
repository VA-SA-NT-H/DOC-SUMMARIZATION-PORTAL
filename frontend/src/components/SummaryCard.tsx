import React from 'react';
import { Card, CardContent, Typography, CardActions, Button, Collapse } from '@mui/material';
import { SummaryResponse } from '../types/document';
import { format } from 'date-fns';

export default function SummaryCard({ summary, onEdit, onDelete }: { summary: SummaryResponse, onEdit?: any, onDelete?: any }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          Model: {summary.modelUsed} · Ratio: {summary.summaryRatio} · Confidence: {(summary.confidenceScore ?? 0).toFixed(2)}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {open ? summary.summaryText : (summary.summaryText.length > 400 ? summary.summaryText.slice(0, 400) + '...' : summary.summaryText)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display:'block', mt:1 }}>
          Created: {format(new Date(summary.createdAt), 'yyyy-MM-dd HH:mm')}
        </Typography>
      </CardContent>
      <CardActions>
        { summary.summaryText.length > 400 && <Button size="small" onClick={() => setOpen(s => !s)}>{open ? 'Show less' : 'Read more'}</Button> }
        {onEdit && <Button size="small" onClick={() => onEdit(summary)}>Edit</Button>}
        {onDelete && <Button size="small" color="error" onClick={() => onDelete(summary.id)}>Delete</Button>}
      </CardActions>
    </Card>
  );
}
