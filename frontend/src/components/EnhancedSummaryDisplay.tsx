import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  formatSummaryText,
  getTypographyVariant,
  getSectionStyles,
  FormattedSummary,
  FormattedSection
} from '../utils/textFormatting';

interface EnhancedSummaryDisplayProps {
  summaryText: string;
  modelUsed?: string;
  confidenceScore?: number;
  createdAt?: string;
  maxContentHeight?: number;
}

const EnhancedSummaryDisplay: React.FC<EnhancedSummaryDisplayProps> = ({
  summaryText,
  modelUsed,
  confidenceScore,
  createdAt,
  maxContentHeight = 600
}) => {
  const theme = useTheme();

  // Format the summary text
  const formattedSummary: FormattedSummary = React.useMemo(() => {
    return formatSummaryText(summaryText);
  }, [summaryText]);

  // Render a single formatted section
  const renderSection = (section: FormattedSection, index: number) => {
    const variant = getTypographyVariant(section.type, section.level);
    const styles = getSectionStyles(section.type, section.level);

    switch (section.type) {
      case 'title':
        return (
          <Typography
            key={section.id}
            variant={variant}
            component="h2"
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              borderBottom: `2px solid ${theme.palette.primary.main}`,
              pb: 1,
              ...styles
            }}
          >
            {section.content}
          </Typography>
        );

      case 'subtitle':
        return (
          <Typography
            key={section.id}
            variant={variant}
            component="h3"
            sx={{
              fontWeight: 'bold',
              color: theme.palette.text.primary,
              ...styles
            }}
          >
            {section.content}
          </Typography>
        );

      case 'bullet-list':
        return (
          <List
            key={section.id}
            dense
            sx={{
              ml: 2,
              mb: 2,
              '& .MuiListItem-root': {
                py: 0.5
              }
            }}
          >
            {section.items?.map((item, itemIndex) => (
              <ListItem key={`${section.id}-item-${itemIndex}`}>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box
                        component="span"
                        sx={{
                          color: theme.palette.primary.main,
                          mr: 1,
                          fontWeight: 'bold'
                        }}
                      >
                        •
                      </Box>
                      <Typography variant="body1" component="span">
                        {item}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        );

      case 'highlight':
        return (
          <Box
            key={section.id}
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: alpha(theme.palette.info.main, 0.05),
              borderLeft: `4px solid ${theme.palette.info.main}`,
              borderRadius: 1
            }}
          >
            <Typography
              variant={variant}
              component="div"
              sx={styles}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </Box>
        );

      case 'content':
      default:
        return (
          <Typography
            key={section.id}
            variant={variant}
            component="p"
            sx={{
              textAlign: 'justify',
              ...styles
            }}
          >
            {section.content}
          </Typography>
        );
    }
  };

  const formatCreatedAt = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Document Summary
        </Typography>

        {/* Metadata */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {modelUsed && (
            <Chip
              label={`Model: ${modelUsed}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {confidenceScore && (
            <Chip
              label={`Confidence: ${Math.round(confidenceScore * 100)}%`}
              size="small"
              color={
                confidenceScore >= 0.8 ? 'success' :
                confidenceScore >= 0.6 ? 'warning' : 'error'
              }
              variant="outlined"
            />
          )}
          {formattedSummary.metadata.hasBulletPoints && (
            <Chip
              label="Contains bullet points"
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>

        {createdAt && (
          <Typography variant="caption" color="text.secondary">
            Generated: {formatCreatedAt(createdAt)}
          </Typography>
        )}
      </Box>

      {/* Summary Statistics */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: alpha(theme.palette.grey[200], 0.5), borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {formattedSummary.metadata.wordCount} words • {formattedSummary.metadata.totalSections} sections
        </Typography>
      </Box>

      {/* Formatted Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: maxContentHeight,
          pr: 1, // Add padding for scrollbar
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.grey[300], 0.3),
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.grey[500],
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.grey[700]
            }
          }
        }}
      >
        {formattedSummary.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            {renderSection(section, index)}
            {/* Add divider between major sections */}
            {section.type === 'title' && index < formattedSummary.sections.length - 1 && (
              <Divider sx={{ my: 2 }} />
            )}
          </React.Fragment>
        ))}

        {/* Fallback for empty summaries */}
        {formattedSummary.sections.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No summary content available.
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary">
          Enhanced formatting with hierarchical structure and key term highlighting
        </Typography>
      </Box>
    </Paper>
  );
};

export default EnhancedSummaryDisplay;