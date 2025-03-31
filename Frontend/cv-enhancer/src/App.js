import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  TextField, 
  Button, 
  CircularProgress 
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Create custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const steps = ['Job Description', 'Your CV', 'Enhanced Results'];

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [cv, setCv] = useState('');
  const [enhancedCV, setEnhancedCV] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (activeStep === 0 && !jobDescription) {
      setError('Please enter a job description');
      return;
    }
    if (activeStep === 1 && !cv) {
      setError('Please enter your CV');
      return;
    }
    
    setError('');
    if (activeStep === 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/enhance-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          cv: cv,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEnhancedCV(data.enhanced_cv);
      setActiveStep(2);
    } catch (error) {
      setError('Error processing your request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = () => {
    const input = document.getElementById('enhanced-cv-content');
    
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('enhanced-cv.pdf');
    });
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <TextField
            label="Job Description"
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            required
          />
        );
      case 1:
        return (
          <TextField
            label="Your CV"
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder="Paste your current CV text here..."
            required
          />
        );
      case 2:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Your Enhanced CV
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Paper 
                  elevation={3} 
                  sx={{ p: 3, my: 2, maxHeight: '500px', overflow: 'auto' }}
                >
                  <div 
                    id="enhanced-cv-content" 
                    dangerouslySetInnerHTML={{ __html: enhancedCV }} 
                  />
                </Paper>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={downloadAsPDF}
                  disabled={!enhancedCV}
                >
                  Download as PDF
                </Button>
              </>
            )}
          </>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Job Application CV Enhancer
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Enhance your CV with keywords from the job description to increase your chances of getting an interview.
          </Typography>
          
          {loading && activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Preparing Your Enhanced CV...
              </Typography>
            </Box>
          )}
          
          <Paper elevation={3} sx={{ p: 3, my: 4, display: loading && activeStep === 1 ? 'none' : 'block' }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <Box sx={{ mb: 2 }}>
              {getStepContent(activeStep)}
            </Box>
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
              >
                Back
              </Button>
              
              {activeStep < 2 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {activeStep === steps.length - 2 ? 'Submit' : 'Next'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setActiveStep(0);
                    setJobDescription('');
                    setCv('');
                    setEnhancedCV('');
                  }}
                  disabled={loading}
                >
                  Start New
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;