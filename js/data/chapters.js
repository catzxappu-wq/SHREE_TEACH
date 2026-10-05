/**
 * SHREE TEACH - JEE Syllabus & Chapters Data
 * Covers complete Physics, Chemistry (Physical, Organic, Inorganic), and Mathematics syllabus
 */

export const JEE_SUBJECTS = {
  Physics: {
    id: 'Physics',
    name: 'Physics',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '⚡',
    chapters: [
      { id: 'phy_units', name: 'Units & Dimensions', weightage: 'High' },
      { id: 'phy_kinematics', name: 'Kinematics', weightage: 'High' },
      { id: 'phy_nl_motion', name: 'Laws of Motion', weightage: 'High' },
      { id: 'phy_wep', name: 'Work, Energy & Power', weightage: 'High' },
      { id: 'phy_rotation', name: 'Rotational Motion', weightage: 'Very High' },
      { id: 'phy_gravitation', name: 'Gravitation', weightage: 'Medium' },
      { id: 'phy_thermo', name: 'Thermodynamics & KTG', weightage: 'Very High' },
      { id: 'phy_shm', name: 'Simple Harmonic Motion (SHM)', weightage: 'Medium' },
      { id: 'phy_waves', name: 'Waves & Sound', weightage: 'Medium' },
      { id: 'phy_electrostatics', name: 'Electrostatics', weightage: 'Very High' },
      { id: 'phy_current', name: 'Current Electricity', weightage: 'Very High' },
      { id: 'phy_magnetism', name: 'Magnetism & Magnetic Effects', weightage: 'High' },
      { id: 'phy_emi_ac', name: 'Electromagnetic Induction & AC', weightage: 'High' },
      { id: 'phy_optics', name: 'Ray & Wave Optics', weightage: 'Very High' },
      { id: 'phy_modern', name: 'Modern Physics', weightage: 'Very High' },
      { id: 'phy_semiconductors', name: 'Semiconductors & Logic Gates', weightage: 'High' }
    ]
  },
  Chemistry: {
    id: 'Chemistry',
    name: 'Chemistry',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: '🧪',
    branches: {
      Physical: {
        name: 'Physical Chemistry',
        chapters: [
          { id: 'chem_mole', name: 'Mole Concept & Stoichiometry', branch: 'Physical', weightage: 'High' },
          { id: 'chem_atomic', name: 'Atomic Structure', branch: 'Physical', weightage: 'High' },
          { id: 'chem_thermo', name: 'Thermodynamics & Thermochemistry', branch: 'Physical', weightage: 'Very High' },
          { id: 'chem_chemeq', name: 'Chemical Equilibrium', branch: 'Physical', weightage: 'Medium' },
          { id: 'chem_ioniceq', name: 'Ionic Equilibrium', branch: 'Physical', weightage: 'High' },
          { id: 'chem_electro', name: 'Electrochemistry', branch: 'Physical', weightage: 'Very High' },
          { id: 'chem_kinetics', name: 'Chemical Kinetics', branch: 'Physical', weightage: 'High' },
          { id: 'chem_solutions', name: 'Solutions & Colligative Properties', branch: 'Physical', weightage: 'High' }
        ]
      },
      Organic: {
        name: 'Organic Chemistry',
        chapters: [
          { id: 'chem_goc', name: 'General Organic Chemistry (GOC)', branch: 'Organic', weightage: 'Very High' },
          { id: 'chem_hydrocarbons', name: 'Hydrocarbons (Alkanes, Alkenes, Alkynes)', branch: 'Organic', weightage: 'High' },
          { id: 'chem_haloalkanes', name: 'Haloalkanes & Haloarenes', branch: 'Organic', weightage: 'High' },
          { id: 'chem_alcohols', name: 'Alcohols, Phenols & Ethers', branch: 'Organic', weightage: 'Very High' },
          { id: 'chem_carbonyls', name: 'Aldehydes, Ketones & Carboxylic Acids', branch: 'Organic', weightage: 'Very High' },
          { id: 'chem_amines', name: 'Amines & Diazonium Salts', branch: 'Organic', weightage: 'High' },
          { id: 'chem_biomolecules', name: 'Biomolecules', branch: 'Organic', weightage: 'High' },
          { id: 'chem_polymers', name: 'Polymers & Practical Organic Chem', branch: 'Organic', weightage: 'Medium' }
        ]
      },
      Inorganic: {
        name: 'Inorganic Chemistry',
        chapters: [
          { id: 'chem_periodic', name: 'Periodic Table & Periodicity', branch: 'Inorganic', weightage: 'High' },
          { id: 'chem_bonding', name: 'Chemical Bonding & Molecular Structure', branch: 'Inorganic', weightage: 'Very High' },
          { id: 'chem_coordination', name: 'Coordination Compounds', branch: 'Inorganic', weightage: 'Very High' },
          { id: 'chem_pblock', name: 'p-Block Elements', branch: 'Inorganic', weightage: 'Very High' },
          { id: 'chem_dfblock', name: 'd- and f-Block Elements', branch: 'Inorganic', weightage: 'High' },
          { id: 'chem_metallurgy', name: 'Metallurgy & Qualitative Analysis', branch: 'Inorganic', weightage: 'Medium' }
        ]
      }
    },
    // Flattened chapters array for easy lookup
    chapters: []
  },
  Mathematics: {
    id: 'Mathematics',
    name: 'Mathematics',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: '📐',
    chapters: [
      { id: 'math_sets_rel', name: 'Sets, Relations & Functions', weightage: 'High' },
      { id: 'math_quadratic', name: 'Quadratic Equations', weightage: 'High' },
      { id: 'math_seq_series', name: 'Sequences & Series (AP, GP, HP)', weightage: 'High' },
      { id: 'math_pnc', name: 'Permutations & Combinations', weightage: 'High' },
      { id: 'math_binomial', name: 'Binomial Theorem', weightage: 'High' },
      { id: 'math_probability', name: 'Probability', weightage: 'Very High' },
      { id: 'math_complex', name: 'Complex Numbers', weightage: 'High' },
      { id: 'math_matrices', name: 'Matrices & Determinants', weightage: 'Very High' },
      { id: 'math_limits_cont', name: 'Limits, Continuity & Differentiability', weightage: 'Very High' },
      { id: 'math_aod', name: 'Application of Derivatives (AOD)', weightage: 'Very High' },
      { id: 'math_indef_def_int', name: 'Definite & Indefinite Integration', weightage: 'Very High' },
      { id: 'math_diff_eqn', name: 'Differential Equations & Area', weightage: 'Very High' },
      { id: 'math_straight_lines', name: 'Straight Lines & Pair of Lines', weightage: 'High' },
      { id: 'math_circles', name: 'Circles', weightage: 'High' },
      { id: 'math_conics', name: 'Conic Sections (Parabola, Ellipse, Hyperbola)', weightage: 'Very High' },
      { id: 'math_vectors', name: 'Vectors & Dot/Cross Products', weightage: 'Very High' },
      { id: 'math_3d_geom', name: '3D Geometry (Lines & Planes)', weightage: 'Very High' }
    ]
  }
};

// Populate flattened chemistry chapters
JEE_SUBJECTS.Chemistry.chapters = [
  ...JEE_SUBJECTS.Chemistry.branches.Physical.chapters,
  ...JEE_SUBJECTS.Chemistry.branches.Organic.chapters,
  ...JEE_SUBJECTS.Chemistry.branches.Inorganic.chapters
];

export function getAllChapters(subjectName) {
  if (subjectName && JEE_SUBJECTS[subjectName]) {
    return JEE_SUBJECTS[subjectName].chapters;
  }
  return [
    ...JEE_SUBJECTS.Physics.chapters,
    ...JEE_SUBJECTS.Chemistry.chapters,
    ...JEE_SUBJECTS.Mathematics.chapters
  ];
}
