/**
 * Maps Cornell API grading basis codes to human-readable descriptions
 */
export function formatGradingBasis(basis?: string): string {
  if (!basis) return "Not specified";
  
  // Normalize for comparison
  const normalized = basis.toUpperCase().trim();
  
  // Map technical codes to user-friendly descriptions
  const mappings: Record<string, string> = {
    // Letter grades
    'GRI': 'Letter Grades (A+, A, A-, B+, B, B-, C+, C, etc.)',
    'LETTER': 'Letter Grades (A+, A, A-, B+, B, B-, C+, C, etc.)',
    'GRD': 'Letter Grades (A+, A, A-, B+, B, B-, C+, C, etc.)',
    
    // Satisfactory/Unsatisfactory
    'SUI': 'Satisfactory/Unsatisfactory (S/U)',
    'S/U': 'Satisfactory/Unsatisfactory (S/U)',
    'SAT': 'Satisfactory/Unsatisfactory (S/U)',
    'SATISFACTORY/UNSATISFACTORY': 'Satisfactory/Unsatisfactory (S/U)',
    
    // Student Option (choose between letter or S/U)
    'OPT': 'Student Option (choose Letter Grades or S/U)',
    'OPI': 'Student Option (choose Letter Grades or S/U)',
    'STO': 'Student Option (choose Letter Grades or S/U)',
    'STUDENT OPTION': 'Student Option (choose Letter Grades or S/U)',
    
    // Pass/Fail
    'P/F': 'Pass/Fail',
    'PAS': 'Pass/Fail',
    'PASS/FAIL': 'Pass/Fail',
    
    // No grade
    'NGR': 'No Grade',
    'NOGRADE': 'No Grade',
  };
  
  // Check exact match first
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // Check partial matches
  if (normalized.includes('LETTER') && normalized.includes('OPTION')) {
    return 'Student Option (choose Letter Grades or S/U)';
  }
  if (normalized.includes('LETTER')) {
    return 'Letter Grades (A+, A, A-, B+, B, B-, C+, C, etc.)';
  }
  if (normalized.includes('S/U') || normalized.includes('SATISFACTORY')) {
    return 'Satisfactory/Unsatisfactory (S/U)';
  }
  if (normalized.includes('OPTION') || normalized.includes('STUDENT')) {
    return 'Student Option (choose Letter Grades or S/U)';
  }
  if (normalized.includes('PASS') || normalized.includes('FAIL')) {
    return 'Pass/Fail';
  }
  
  // Return original if no match found (with cleaned formatting)
  return basis.trim();
}
