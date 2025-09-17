
import { render } from 'https://esm.sh/preact@10.22.1';
import { useState, useMemo, useEffect } from 'https://esm.sh/preact@10.22.1/hooks';
import { html } from 'https://esm.sh/htm@3.1.1/preact';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';

// Define the structure for a single financial goal
interface Goal {
  id: number;
  name: string;
  timing: number; // in years
  requiredFunds: number; // at today's value
  currentSavings: number;
  savingStart: number; // delay in years before starting to save, 0 means starting now
  savingPeriod: number; // in years
  lumpSumReturnRate?: number; // 개별 거치수익률
  periodicReturnRate?: number; // 개별 적립수익률
}

// A modern, harmonious pastel color palette for the chart.
const GOAL_COLORS = [
  '#ffadad', // Pastel Red
  '#ffd6a5', // Pastel Orange
  '#fdffb6', // Pastel Yellow
  '#caffbf', // Pastel Green
  '#9bf6ff', // Pastel Cyan
  '#a0c4ff', // Pastel Blue
  '#bdb2ff', // Pastel Purple
  '#ffc6ff', // Pastel Magenta
  '#f0e68c', // Khaki
  '#ffdab9', // Peach
  '#e6e6fa', // Lavender
  '#b0e0e6', // Powder Blue
  '#d8bfd8', // Thistle
  '#c1e1c1', // Mint Cream
  '#f5e3e6', // Soft Pink
  '#e2d2f2'  // Light Lavender
];

const App = () => {
  // Economic assumptions
  const [economicAssumptions, setEconomicAssumptions] = useState({
    inflationRate: 2.5,
    educationInflationRate: 6.0,
    loanInterestRate: 3.8,
    expectedReturnRate: 3.0,
    postRetirementInflationRate: 2.0,
    postRetirementExpectedReturnRate: 2.5,
  });

  // Personal information
  const [personalInfo, setPersonalInfo] = useState({
    clientAge: 27,
    spouseAge: 25,
    clientIncome: 300,
    spouseIncome: 250,
    clientPension: 80,
    spousePension: 70,
    clientRetirementAge: 60,
    spouseRetirementAge: 57,
    clientLifeExpectancy: 90,
    spouseLifeExpectancy: 90,
    clientSalaryIncreaseRate: 3.0,
    spouseSalaryIncreaseRate: 2.5,
    children: [{ age: -4 }],
  });


  // State for the list of financial goals
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, name: '결혼자금', timing: 3, requiredFunds: 3000, currentSavings: 0, savingStart: 0, savingPeriod: 3 },
    { id: 2, name: '전세자금', timing: 3, requiredFunds: 3000, currentSavings: 0, savingStart: 0, savingPeriod: 3 },
    { id: 3, name: '전세자금이자', timing: 3, requiredFunds: 20000, currentSavings: 0, savingStart: 3, savingPeriod: 8 },
    { id: 4, name: '주택마련', timing: 11, requiredFunds: 20000, currentSavings: 0, savingStart: 3, savingPeriod: 8 },
    { id: 5, name: '대출상환', timing: 11, requiredFunds: 20000, currentSavings: 0, savingStart: 11, savingPeriod: 20 },
    { id: 6, name: '첫째대학', timing: 24, requiredFunds: 5000, currentSavings: 0, savingStart: 11, savingPeriod: 13 },
    { id: 7, name: '둘째대학', timing: 26, requiredFunds: 5000, currentSavings: 0, savingStart: 11, savingPeriod: 15 },
    { id: 8, name: '첫째결혼', timing: 34, requiredFunds: 10000, currentSavings: 0, savingStart: 24, savingPeriod: 10 },
    { id: 9, name: '둘째결혼', timing: 36, requiredFunds: 10000, currentSavings: 0, savingStart: 26, savingPeriod: 10 },
    { id: 10, name: '은퇴자금', timing: 33, requiredFunds: 100, currentSavings: 0, savingStart: 24, savingPeriod: 11 },
    { id: 11, name: '은퇴자금2', timing: 33, requiredFunds: 100, currentSavings: 0, savingStart: 24, savingPeriod: 11 },
  ]);

  // State to track the selected goal from the chart
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  
  // State for drag-and-drop functionality
  const [draggedGoalId, setDraggedGoalId] = useState<number | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<number | null>(null);

  // State to track which plan slots are saved
  const [savedPlans, setSavedPlans] = useState<boolean[]>([false, false, false]);
  const [planSavingsTotals, setPlanSavingsTotals] = useState<(number | null)[]>([null, null, null]);
  
  // State for PDF generation loading
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Check localStorage on initial load to see which plans are saved and retrieve their totals
  useEffect(() => {
    const plansExist: boolean[] = [];
    const totals: (number | null)[] = [];
    [1, 2, 3].forEach(i => {
      const savedData = localStorage.getItem(`financialPlan_${i}`);
      if (savedData) {
        plansExist.push(true);
        try {
          const planData = JSON.parse(savedData);
          // Read the saved total directly from the new property
          if (typeof planData.totalSavingsPrincipal === 'number') {
            totals.push(planData.totalSavingsPrincipal);
          } else {
            totals.push(null); // Handle old data format or missing total
          }
        } catch {
          totals.push(null);
        }
      } else {
        plansExist.push(false);
        totals.push(null);
      }
    });
    setSavedPlans(plansExist);
    setPlanSavingsTotals(totals);
  }, []);
  
  // Calculate spouse's maternity leave years
  const maternityLeaveYears = useMemo(() => {
      const leaveYears = new Set<number>();
      personalInfo.children.forEach(child => {
          if (child.age < 0) {
              // Leave is the year after birth. Birth year is -child.age.
              const leaveYear = -child.age + 1;
              leaveYears.add(leaveYear);
          }
      });
      return leaveYears;
  }, [personalInfo.children]);
  
  // Calculate expected total income for client and spouse
  const expectedTotalIncome = useMemo(() => {
    const calculateTotalIncome = (
      currentAge: number,
      retirementAge: number,
      monthlyIncome: number,
      increaseRate: number,
      leaveYears: Set<number>
    ) => {
      const workingYears = Math.max(0, retirementAge - currentAge);
      const rate = increaseRate / 100;
      let totalIncome = 0;
      for (let i = 0; i < workingYears; i++) {
        const currentYear = i + 1;
        let annualIncome;
        
        // Apply maternity leave logic if applicable
        if (leaveYears.has(currentYear)) {
          // During leave year, monthly income is fixed at 190.
          annualIncome = 190 * 12;
        } else {
          annualIncome = monthlyIncome * 12 * Math.pow(1 + rate, i);
        }
        
        totalIncome += annualIncome;
      }
      return totalIncome;
    };

    const clientTotal = calculateTotalIncome(
      personalInfo.clientAge,
      personalInfo.clientRetirementAge,
      personalInfo.clientIncome,
      personalInfo.clientSalaryIncreaseRate,
      new Set() // No leave for client
    );

    const spouseTotal = calculateTotalIncome(
      personalInfo.spouseAge,
      personalInfo.spouseRetirementAge,
      personalInfo.spouseIncome,
      personalInfo.spouseSalaryIncreaseRate,
      maternityLeaveYears // Apply leave years for spouse
    );

    return { client: clientTotal, spouse: spouseTotal };
  }, [personalInfo, maternityLeaveYears]);


  // Handlers for state updates
  const handleEconomicChange = (field: keyof typeof economicAssumptions, value: string) => {
    setEconomicAssumptions(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handlePersonalInfoChange = (field: keyof Omit<typeof personalInfo, 'children'>, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };
  
  const addChild = () => {
    setPersonalInfo(prev => ({
        ...prev,
        children: [...prev.children, { age: 0 }]
    }));
  };

  const removeChild = (index: number) => {
      setPersonalInfo(prev => ({
          ...prev,
          children: prev.children.filter((_, i) => i !== index)
      }));
  };

  const handleChildAgeChange = (index: number, value: string) => {
      const newChildren = [...personalInfo.children];
      newChildren[index] = { age: parseInt(value, 10) || 0 };
      setPersonalInfo(prev => ({
          ...prev,
          children: newChildren
      }));
  };


  // Function to add a new goal
  const addGoal = () => {
    setGoals([
      ...goals,
      { id: Date.now(), name: '', timing: 0, requiredFunds: 0, currentSavings: 0, savingStart: 0, savingPeriod: 0 },
    ]);
  };

  // Function to remove a goal
  const removeGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  // Handles changes in goal input fields, parsing comma-formatted numbers.
  const handleGoalChange = (id: number, field: keyof Goal, value: string | number) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id !== id) return goal;

        if (typeof value === 'string' && field !== 'name') {
          const cleanedValue = value.replace(/,/g, ''); // Remove commas
          const num = parseFloat(cleanedValue);
          
          if (field === 'lumpSumReturnRate' || field === 'periodicReturnRate') {
            return { ...goal, [field]: isNaN(num) ? undefined : num };
          }
          return { ...goal, [field]: isNaN(num) ? 0 : num }; // Use isNaN check
        }
        
        return { ...goal, [field]: value };
      })
    );
  };
    
  // A helper to format numbers as Korean currency (simplified, without KRW symbol)
  const formatNumber = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '0';
    return Math.round(num).toLocaleString('ko-KR');
  }
  
    // Drag and drop handlers for reordering goals
  const handleDragStart = (e: any, goalId: number) => {
    setDraggedGoalId(goalId);
    e.dataTransfer.setData('text/plain', goalId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: any, goalId: number) => {
    e.preventDefault();
    if (goalId !== draggedGoalId) {
        setDragOverGoalId(goalId);
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: any, dropGoalId: number) => {
    e.preventDefault();
    if (draggedGoalId === null || draggedGoalId === dropGoalId) {
        setDragOverGoalId(null);
        setDraggedGoalId(null);
        return;
    }

    const draggedIndex = goals.findIndex(g => g.id === draggedGoalId);
    const dropIndex = goals.findIndex(g => g.id === dropGoalId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newGoals = [...goals];
    const [draggedGoal] = newGoals.splice(draggedIndex, 1);
    newGoals.splice(dropIndex, 0, draggedGoal);

    setGoals(newGoals);
    setDraggedGoalId(null);
    setDragOverGoalId(null);
  };

  const handleDragEnd = () => {
    setDraggedGoalId(null);
    setDragOverGoalId(null);
  };
  
  // Handlers for plan saving and restoring
  const handleSavePlan = (planIndex: number) => {
    // Calculate the total savings principal based on the new formula
    const totalSavingsPrincipal = processedGoals.reduce((acc, goal) => {
        const principalForGoal = (goal.savingPeriod || 0) * (goal.monthlyPayment || 0) * 12;
        return acc + principalForGoal;
    }, 0);

    const planData = {
        personalInfo,
        economicAssumptions,
        goals,
        totalSavingsPrincipal, // Save the newly calculated total
    };
    localStorage.setItem(`financialPlan_${planIndex + 1}`, JSON.stringify(planData));
    
    const newSavedPlans = [...savedPlans];
    newSavedPlans[planIndex] = true;
    setSavedPlans(newSavedPlans);
    
    // Update the state for immediate UI feedback with the new total
    const newTotals = [...planSavingsTotals];
    newTotals[planIndex] = totalSavingsPrincipal;
    setPlanSavingsTotals(newTotals);

    alert(`플랜 ${planIndex + 1}이(가) 저장되었습니다.`);
  };

  const handleRestorePlan = (planIndex: number) => {
    const savedData = localStorage.getItem(`financialPlan_${planIndex + 1}`);
    if (savedData) {
      try {
        const planData = JSON.parse(savedData);
        if (planData.personalInfo && planData.economicAssumptions && planData.goals) {
          setPersonalInfo(planData.personalInfo);
          setEconomicAssumptions(planData.economicAssumptions);
          setGoals(planData.goals);
          alert(`플랜 ${planIndex + 1}을(를) 복구했습니다.`);
        } else {
          alert('저장된 데이터 형식이 올바르지 않습니다.');
        }
      } catch (error) {
        console.error("Failed to parse plan data:", error);
        alert('데이터를 복구하는 중 오류가 발생했습니다.');
      }
    }
  };

  // Handler for saving the report as a PDF
  const handleSaveAsPdf = async () => {
    setIsGeneratingPdf(true);
    document.body.classList.add('pdf-generating'); // Prepare styles for PDF capture
    const pdfButton = document.querySelector('.pdf-btn');

    try {
      if (pdfButton) pdfButton.classList.add('hide-for-pdf'); // Temporarily hide the button
      
      // Add a small delay to ensure the browser has repainted with the new styles
      await new Promise(resolve => setTimeout(resolve, 50));

      const input = document.getElementById('app-container');
      if (!input) {
        throw new Error("App container element not found for PDF generation.");
      }

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Determine optimal orientation for the PDF based on the content's aspect ratio.
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const orientation = canvasWidth > canvasHeight ? 'l' : 'p'; // 'l' for landscape, 'p' for portrait
      
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate the image height to maintain aspect ratio when fitting to page width
      const ratio = canvasWidth / canvasHeight;
      const imgHeight = pdfWidth / ratio;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add the image to the first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Add subsequent pages if the content is taller than one page
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save('financial_plan.pdf');

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF를 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      if (pdfButton) pdfButton.classList.remove('hide-for-pdf'); // Always ensure the button is shown again
      document.body.classList.remove('pdf-generating'); // Revert styles
      setIsGeneratingPdf(false);
    }
  };


  // Use useMemo to calculate derived data only when dependencies change
  const processedGoals = useMemo(() => {
    return goals.map(goal => {
      const safeGoal = { ...goal }; // Create a mutable copy

      // Use parseFloat with a fallback to 0 to prevent NaN issues from empty inputs
      for (const key in safeGoal) {
        if (typeof (safeGoal as any)[key] === 'number') {
            (safeGoal as any)[key] = (safeGoal as any)[key] || 0;
        }
      }

      // Determine effective rates for the current goal (individual or global)
      const goalLumpSumRate = (safeGoal.lumpSumReturnRate ?? economicAssumptions.expectedReturnRate) / 100;
      const goalPeriodicRate = (safeGoal.periodicReturnRate ?? economicAssumptions.expectedReturnRate) / 100;
      
      // 1. 기필요자금 (Future Value of Required Funds)
      let futureValueRequired;
      
      if (safeGoal.name.includes('전세자금이자')) {
        futureValueRequired = safeGoal.requiredFunds;
      } else if (safeGoal.name.includes('은퇴')) {
        const monthlyRequired = safeGoal.requiredFunds;
        const annualRequired = monthlyRequired * 12;
        const generalInflationRate = economicAssumptions.inflationRate / 100;
        const firstYearRetirementIncome = annualRequired * Math.pow(1 + generalInflationRate, safeGoal.timing);

        const postRetirementPeriod = Math.max(0, personalInfo.clientLifeExpectancy - personalInfo.clientRetirementAge);
        // During retirement, use post-retirement specific rates for calculation
        const r = economicAssumptions.postRetirementExpectedReturnRate / 100;
        const g = economicAssumptions.postRetirementInflationRate / 100;
        const n = postRetirementPeriod;

        if (r <= g) {
          // If returns don't outpace inflation, a simple multiplication is a practical approximation.
          futureValueRequired = firstYearRetirementIncome * n;
        } else {
          // Present value of a growing annuity formula
          const C = firstYearRetirementIncome;
          futureValueRequired = C * (1 - Math.pow((1 + g) / (1 + r), n)) / (r - g);
        }
      } else if (safeGoal.name.includes('대출상환')) {
        futureValueRequired = safeGoal.requiredFunds;
      } else {
        let applicableInflationRate = economicAssumptions.inflationRate / 100;
        if (safeGoal.name.includes('대학')) {
          applicableInflationRate = economicAssumptions.educationInflationRate / 100;
        }
        futureValueRequired = safeGoal.requiredFunds * Math.pow(1 + applicableInflationRate, safeGoal.timing);
      }
      
      // 2. 기준비자금 (Future Value of Current Savings)
      const futureValueCurrent = safeGoal.currentSavings * Math.pow(1 + goalLumpSumRate, safeGoal.timing);

      // 3. 필요차액 (Shortfall)
      const shortfall = Math.max(0, futureValueRequired - futureValueCurrent);
      
      // 4. 필요적립금 (Required Monthly Payment) - Advanced Calculation
      let monthlyPayment = 0;
      const holdingPeriod = safeGoal.timing - safeGoal.savingStart - safeGoal.savingPeriod;

      if (safeGoal.name.includes('전세자금이자')) {
          monthlyPayment = safeGoal.requiredFunds * (economicAssumptions.loanInterestRate / 100) / 12;
      } else if (safeGoal.name.includes('대출상환')) {
          const principal = safeGoal.requiredFunds;
          const monthlyLoanRate = economicAssumptions.loanInterestRate / 100 / 12;
          const numLoanMonths = safeGoal.savingPeriod * 12;

          if (numLoanMonths > 0 && monthlyLoanRate > 0) {
              // Standard loan amortization formula (PMT)
              // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
              const rateFactor = Math.pow(1 + monthlyLoanRate, numLoanMonths);
              monthlyPayment = principal * (monthlyLoanRate * rateFactor) / (rateFactor - 1);
          } else if (numLoanMonths > 0) {
              // If interest rate is 0, simple division
              monthlyPayment = principal / numLoanMonths;
          }
      } else {
          const targetValueAtEndOfSaving = shortfall / Math.pow(1 + goalLumpSumRate, holdingPeriod);
          const monthlyRate = goalPeriodicRate / 12;
          const numMonths = safeGoal.savingPeriod * 12;
          
          if (numMonths > 0) {
              if (monthlyRate > 0) {
                  // Future value of an ordinary annuity formula rearranged to solve for Payment (PMT)
                  // PMT = FV * [r / ((1+r)^n - 1)]
                  monthlyPayment = targetValueAtEndOfSaving * (monthlyRate / (Math.pow(1 + monthlyRate, numMonths) - 1));
              } else {
                  // If rate is 0, it's just a simple division.
                  monthlyPayment = targetValueAtEndOfSaving / numMonths;
              }
          }
      }

      return {
        ...safeGoal,
        futureValueRequired,
        futureValueCurrent,
        shortfall,
        monthlyPayment,
        holdingPeriod,
      };
    });
  }, [goals, economicAssumptions, personalInfo]);

  // Calculate totals for the summary row
  const totals = useMemo(() => {
    // Shortfall total is no longer displayed.
    return processedGoals.reduce((acc, goal) => {
        acc.currentSavings += goal.currentSavings;
        // The sum for monthly payment is conditional on saving starting immediately (year 0)
        if (goal.savingStart === 0) {
          acc.monthlyPayment += goal.monthlyPayment;
        }
        return acc;
    }, { currentSavings: 0, monthlyPayment: 0 });
  }, [processedGoals]);


  const renderChart = () => {
    if (processedGoals.length === 0) return null;

    const maxTiming = Math.max(
      ...processedGoals.map(g => (g.savingStart || 0) + (g.savingPeriod || 0)),
      ...processedGoals.map(g => g.timing || 0),
      0
    );
    if (maxTiming === 0) return html`<p>그래프를 표시하려면 목표 시기를 입력하세요.</p>`;

    const yearlyData = Array.from({ length: maxTiming }, (_, i) => ({ year: i + 1, total: 0, goals: {} as Record<number, {name: string, payment: number, color: string}> }));
    
    // Create a map of goal ID to color for consistent use in legend and chart bars
    const goalColorMap = new Map<number, string>();
    processedGoals.forEach((goal, index) => {
        goalColorMap.set(goal.id, GOAL_COLORS[index % GOAL_COLORS.length]);
    });
    
    processedGoals.forEach((goal, index) => {
        const startYearIndex = goal.savingStart || 0;
        const endYearIndex = startYearIndex + goal.savingPeriod;
        const color = goalColorMap.get(goal.id)!;
        
        for (let i = startYearIndex; i < endYearIndex; i++) {
            if (yearlyData[i]) {
                yearlyData[i].total += goal.monthlyPayment;
                if (!yearlyData[i].goals[goal.id]) {
                    yearlyData[i].goals[goal.id] = { name: goal.name || `목표 ${index + 1}`, payment: 0, color };
                }
                yearlyData[i].goals[goal.id].payment += goal.monthlyPayment;
            }
        }
    });

    // Find the timing of the "결혼자금" goal.
    const marriageGoal = processedGoals.find(g => g.name.includes('결혼자금'));
    // If not found, default to 0, which means combined income from the start.
    const marriageTiming = marriageGoal ? marriageGoal.timing : 0;

    // Calculate yearly income for the line chart
    const yearlyIncomeData = Array.from({ length: maxTiming }, (_, i) => {
        const currentYear = i + 1;
        
        // Always calculate client's income
        let clientIncomeForYear = 0;
        if ((personalInfo.clientAge + currentYear) <= personalInfo.clientRetirementAge) {
            clientIncomeForYear = personalInfo.clientIncome * Math.pow(1 + (personalInfo.clientSalaryIncreaseRate / 100), i);
        }
        
        let spouseIncomeForYear = 0;
        // Only include spouse's income from the year AFTER marriage
        if (currentYear > marriageTiming) {
            if ((personalInfo.spouseAge + currentYear) <= personalInfo.spouseRetirementAge) {
                if (maternityLeaveYears.has(currentYear)) {
                    // During leave year, monthly income becomes 190.
                    spouseIncomeForYear = 190;
                } else {
                    spouseIncomeForYear = personalInfo.spouseIncome * Math.pow(1 + (personalInfo.spouseSalaryIncreaseRate / 100), i);
                }
            }
        }
        
        return clientIncomeForYear + spouseIncomeForYear;
    });

    const maxTotal = Math.max(...yearlyData.map(y => y.total), 0);
    const maxIncome = Math.max(...yearlyIncomeData, 0);
    const unifiedMaxY = Math.max(maxTotal, maxIncome);

    const linePoints = yearlyIncomeData.map((income, index) => {
        const x = (index + 0.5) / maxTiming * 100;
        const y = 100 - (unifiedMaxY > 0 ? (income / unifiedMaxY) * 100 : 0);
        return `${x},${y}`;
    }).join(' ');

    if (unifiedMaxY === 0) return html`<p>월 필요적립금 또는 소득이 계산되면 그래프가 표시됩니다.</p>`;

    return (
        html`
        <div class="chart-container">
            <div class="chart-legend">
                ${processedGoals.map((goal) => (
                    html`<div key=${goal.id} class="legend-item">
                        <span class="legend-color" style=${{ backgroundColor: goalColorMap.get(goal.id) }}></span>
                        ${goal.name}
                    </div>`
                ))}
                <div class="legend-item">
                    <span class="legend-line"></span>
                    부부 합산 월소득
                </div>
            </div>
            <div class="chart">
                <div class="bars-container">
                    <div class="bars" onClick=${() => setSelectedGoalId(null)}>
                        ${yearlyData.map((yearData, index) => {
                          const barWidth = 100 / maxTiming;
                          const style = { left: `${index * barWidth}%`, width: `${barWidth}%` };
                          return (
                            html`<div key=${yearData.year} class="bar-wrapper" style=${style}>
                                ${yearData.total > 0 && html`<span class="bar-value" style=${{ bottom: `${(yearData.total / unifiedMaxY) * 100}%` }}>${formatNumber(yearData.total)}</span>`}
                                <div class="bar" style=${{ height: unifiedMaxY > 0 ? `${(yearData.total / unifiedMaxY) * 100}%` : '0%' }}>
                                    ${Object.entries(yearData.goals).map(([goalIdStr, data]) => {
                                        const goalId = parseInt(goalIdStr, 10);
                                        const heightPercent = yearData.total > 0 ? (data.payment / yearData.total) * 100 : 0;
                                        return (
                                            html`<div 
                                                key=${goalId}
                                                class=${`bar-segment ${selectedGoalId !== null && selectedGoalId !== goalId ? 'dimmed' : ''}`}
                                                style=${{ height: `${heightPercent}%`, backgroundColor: data.color }}
                                                title=${`${data.name}: ${formatNumber(data.payment)}`}
                                                onClick=${(e) => {
                                                  e.stopPropagation();
                                                  setSelectedGoalId(prevId => prevId === goalId ? null : goalId);
                                                }}
                                            ></div>`
                                        );
                                    })}
                                </div>
                                <span class="x-axis-label">${yearData.year}년</span>
                            </div>`
                          );
                        })}
                    </div>
                    <div class="line-chart-wrapper">
                        <svg class="line-chart-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <polyline points=${linePoints} />
                            ${yearlyIncomeData.map((income, index) => {
                                if (income <= 0) return null;
                                const x = (index + 0.5) / maxTiming * 100;
                                const y = 100 - (unifiedMaxY > 0 ? (income / unifiedMaxY) * 100 : 0);
                                return (
                                    html`<g key=${`marker-group-${index}`} class="marker-group">
                                      <ellipse class="marker" cx=${x} cy=${y} rx="0.53" ry="0.8" />
                                    </g>`
                                );
                            })}
                        </svg>
                        ${yearlyIncomeData.map((income, index) => {
                            if (income <= 0) return null;
                            const xPercent = (index + 0.5) / maxTiming * 100;
                            const yPercent = (unifiedMaxY > 0 ? (income / unifiedMaxY) * 100 : 0);
                            const style = {
                                left: `${xPercent}%`,
                                bottom: `${yPercent}%`,
                            };
                            return html`<span class="line-chart-label-html" style=${style}>${formatNumber(income)}</span>`;
                        })}
                    </div>
                </div>
            </div>
        </div>`
    );
  };
  
  return (
    html`
    ${isGeneratingPdf && html`
        <div class="pdf-loader-overlay">
            <div class="loader-content">
                <div class="spinner"></div>
                <p>PDF 저장 중...</p>
            </div>
        </div>
    `}
    <div class="container" id="app-container" aria-labelledby="app-title">
      <main>
        <section class="settings" aria-labelledby="economic-assumptions-title">
          <div class="section-header">
            <h2 id="economic-assumptions-title">기본정보</h2>
            <button class="pdf-btn" onClick=${handleSaveAsPdf} disabled=${isGeneratingPdf}>
              ${isGeneratingPdf ? '저장 중...' : 'PDF로 저장'}
            </button>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label for="inflation-rate">물가상승률 (%)</label>
              <input type="number" id="inflation-rate" value=${economicAssumptions.inflationRate} onInput=${e => handleEconomicChange('inflationRate', (e.target as HTMLInputElement).value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="education-inflation-rate">교육비상승률 (%)</label>
              <input type="number" id="education-inflation-rate" value=${economicAssumptions.educationInflationRate} onInput=${e => handleEconomicChange('educationInflationRate', (e.target as HTMLInputElement).value)} step="0.1" />
            </div>
             <div class="form-group">
              <label for="loan-interest-rate">대출이율 (%)</label>
              <input type="number" id="loan-interest-rate" value=${economicAssumptions.loanInterestRate} onInput=${e => handleEconomicChange('loanInterestRate', (e.target as HTMLInputElement).value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="expected-return-rate">기대수익률 (%)</label>
              <input type="number" id="expected-return-rate" value=${economicAssumptions.expectedReturnRate} onInput=${e => handleEconomicChange('expectedReturnRate', (e.target as HTMLInputElement).value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="post-retirement-inflation-rate">은퇴후물가상승률 (%)</label>
              <input type="number" id="post-retirement-inflation-rate" value=${economicAssumptions.postRetirementInflationRate} onInput=${e => handleEconomicChange('postRetirementInflationRate', (e.target as HTMLInputElement).value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="post-retirement-expected-return-rate">은퇴후기대수익률 (%)</label>
              <input type="number" id="post-retirement-expected-return-rate" value=${economicAssumptions.postRetirementExpectedReturnRate} onInput=${e => handleEconomicChange('postRetirementExpectedReturnRate', (e.target as HTMLInputElement).value)} step="0.1" />
            </div>
          </div>
        </section>

        <section class="settings" aria-labelledby="personal-info-title">
          <div class="table-wrapper">
            <table class="personal-info-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>나이</th>
                  <th>월소득</th>
                  <th>국민연금예상</th>
                  <th>은퇴시점</th>
                  <th>기대여명</th>
                  <th>급여상승률(%)</th>
                  <th>예상총소득</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>고객</td>
                  <td><input type="number" value=${personalInfo.clientAge} onInput=${e => handlePersonalInfoChange('clientAge', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.clientIncome} onInput=${e => handlePersonalInfoChange('clientIncome', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.clientPension} onInput=${e => handlePersonalInfoChange('clientPension', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.clientRetirementAge} onInput=${e => handlePersonalInfoChange('clientRetirementAge', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.clientLifeExpectancy} onInput=${e => handlePersonalInfoChange('clientLifeExpectancy', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.clientSalaryIncreaseRate} onInput=${e => handlePersonalInfoChange('clientSalaryIncreaseRate', (e.target as HTMLInputElement).value)} step="0.1" /></td>
                  <td>${formatNumber(expectedTotalIncome.client)}</td>
                </tr>
                 <tr>
                  <td>배우자</td>
                  <td><input type="number" value=${personalInfo.spouseAge} onInput=${e => handlePersonalInfoChange('spouseAge', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.spouseIncome} onInput=${e => handlePersonalInfoChange('spouseIncome', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.spousePension} onInput=${e => handlePersonalInfoChange('spousePension', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.spouseRetirementAge} onInput=${e => handlePersonalInfoChange('spouseRetirementAge', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.spouseLifeExpectancy} onInput=${e => handlePersonalInfoChange('spouseLifeExpectancy', (e.target as HTMLInputElement).value)} /></td>
                  <td><input type="number" value=${personalInfo.spouseSalaryIncreaseRate} onInput=${e => handlePersonalInfoChange('spouseSalaryIncreaseRate', (e.target as HTMLInputElement).value)} step="0.1" /></td>
                  <td>${formatNumber(expectedTotalIncome.spouse)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="children-info">
            ${personalInfo.children.map((child, index) => (
              html`<div key=${index} class="form-group child-group">
                <label for=${`child${index}-age`}>자녀${index + 1}</label>
                <input
                  type="number"
                  id=${`child${index}-age`}
                  value=${child.age}
                  onInput=${(e) => handleChildAgeChange(index, (e.target as HTMLInputElement).value)}
                />
                <button onClick=${() => removeChild(index)} class="remove-btn-small" aria-label=${`자녀 ${index + 1} 삭제`}>X</button>
              </div>`
            ))}
            <button onClick=${addChild} class="add-btn-small">+ 자녀 추가</button>
          </div>
        </section>

        <section class="goals-table" aria-labelledby="goals-title">
           <div class="section-header">
             <h2 id="goals-title">재무 목표 입력</h2>
             <button onClick=${addGoal} class="add-btn">+ 목표 추가</button>
           </div>
          <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>재무목표</th>
                    <th>시기</th>
                    <th>필요자금</th>
                    <th>기필요자금</th>
                    <th>현재준비</th>
                    <th>기준비자금</th>
                    <th>필요차액</th>
                    <th>저축시작</th>
                    <th>저축기간</th>
                    <th>월적립금</th>
                    <th>거치기간</th>
                    <th>거치수익률</th>
                    <th>적립수익률</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  ${processedGoals.map((goal, index) => (
                    html`<tr 
                      key=${goal.id}
                      draggable=${true}
                      onDragStart=${(e) => handleDragStart(e, goal.id)}
                      onDragEnter=${(e) => handleDragEnter(e, goal.id)}
                      onDragOver=${handleDragOver}
                      onDrop=${(e) => handleDrop(e, goal.id)}
                      onDragEnd=${handleDragEnd}
                      class=${`${goal.id === selectedGoalId ? 'highlighted-row' : ''} ${goal.id === draggedGoalId ? 'dragging' : ''} ${goal.id === dragOverGoalId ? 'drag-over' : ''}`}
                    >
                      <td><input type="text" value=${goal.name} onInput=${e => handleGoalChange(goal.id, 'name', (e.target as HTMLInputElement).value)} placeholder=${`목표 ${index + 1}`} /></td>
                      <td><input type="number" value=${goal.timing} onInput=${e => handleGoalChange(goal.id, 'timing', (e.target as HTMLInputElement).value)} step="1" /></td>
                      <td><input type="number" value=${goal.requiredFunds} onInput=${e => handleGoalChange(goal.id, 'requiredFunds', (e.target as HTMLInputElement).value)} step=${goal.name.includes('은퇴') ? 10 : 1000} /></td>
                      <td>${formatNumber(goal.futureValueRequired)}</td>
                      <td><input type="number" value=${goal.currentSavings} onInput=${e => handleGoalChange(goal.id, 'currentSavings', (e.target as HTMLInputElement).value)} step="1000" disabled=${goal.name.includes('전세자금이자')} /></td>
                      <td>${formatNumber(goal.futureValueCurrent)}</td>
                      <td>${formatNumber(goal.shortfall)}</td>
                      <td><input type="number" value=${goal.savingStart} onInput=${e => handleGoalChange(goal.id, 'savingStart', (e.target as HTMLInputElement).value)} step="1" /></td>
                      <td><input type="number" value=${goal.savingPeriod} onInput=${e => handleGoalChange(goal.id, 'savingPeriod', (e.target as HTMLInputElement).value)} step="1" /></td>
                      <td class="highlight">${formatNumber(goal.monthlyPayment)}</td>
                      <td>${formatNumber(goal.holdingPeriod)}</td>
                      <td><input type="number" step="0.1" value=${goal.lumpSumReturnRate ?? economicAssumptions.expectedReturnRate} onInput=${e => handleGoalChange(goal.id, 'lumpSumReturnRate', (e.target as HTMLInputElement).value)} disabled=${goal.name.includes('대출상환') || goal.name.includes('전세자금이자')} /></td>
                      <td><input type="number" step="0.1" value=${goal.periodicReturnRate ?? economicAssumptions.expectedReturnRate} onInput=${e => handleGoalChange(goal.id, 'periodicReturnRate', (e.target as HTMLInputElement).value)} disabled=${goal.name.includes('대출상환') || goal.name.includes('전세자금이자')} /></td>
                      <td><button onClick=${() => removeGoal(goal.id)} class="remove-btn" aria-label=${`${goal.name} 목표 삭제`}>X</button></td>
                    </tr>`
                  ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan=${4}><strong>합계</strong></td>
                        <td><strong>${formatNumber(totals.currentSavings)}</strong></td>
                        <td>-</td>
                        <td>-</td>
                        <td colSpan=${2}>-</td>
                        <td class="highlight"><strong>${formatNumber(totals.monthlyPayment)}</strong></td>
                        <td colSpan=${4}></td>
                    </tr>
                </tfoot>
              </table>
          </div>
        </section>

        <section class="plan-management" aria-label="플랜 관리">
          <div class="plan-slots">
            ${[0, 1, 2].map((index) => (
              html`<div key=${index} class="plan-slot">
                <span class="plan-label">플랜 ${index + 1}</span>
                <button onClick=${() => handleSavePlan(index)}>저장</button>
                <button onClick=${() => handleRestorePlan(index)} disabled=${!savedPlans[index]}>복구</button>
                ${planSavingsTotals[index] !== null && (
                  html`<span class="plan-total-savings">
                    총저축 원금: ${formatNumber(planSavingsTotals[index]!)}
                  </span>`
                )}
              </div>`
            ))}
          </div>
        </section>

        <section class="results" aria-labelledby="chart-title">
            <h2 id="chart-title">분석 그래프</h2>
            ${renderChart()}
        </section>

      </main>
    </div>
  `
  );
};

render(html`<${App} />`, document.getElementById('root')!);
