import React, { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

const SavingsPlanTable = ({ savingsData, savingsPlan, onSavingsPlanChange, onFocus }) => {
    if (!savingsData) return null;

    const formatNumber = (value) => {
        if (isNaN(value) || !isFinite(value)) return 'N/A';
        return Math.round(value).toLocaleString('ko-KR');
    };

    const formatInputNumber = (value) => {
        if (value === '' || value === null || isNaN(value) || !isFinite(value)) return '';
        return Math.round(Number(value)).toLocaleString('ko-KR');
    };
    
    const formatYears = (value) => {
        if (isNaN(value) || !isFinite(value)) return 'N/A';
        return `${value}년 간`;
    }

    const headers = ['구분', '필요자금', '현재준비', '기준비자금', '부족자금', '저축시작', '저축기간', '적용수익률', '월적립액', '거치기간'];
    
    return (
        <div className="savings-plan-container">
            <span className="table-unit">(단위 : 만원)</span>
            <table className="savings-plan-table">
                <thead>
                    <tr>
                        {headers.map(h => <th key={h}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="row-label">무위험수익률</td>
                        <td rowSpan={2}>{formatNumber(savingsData.requiredFund)}</td>
                        <td rowSpan={2}>
                            <div className="input-wrapper-table">
                                <input 
                                    type="text" 
                                    name="severancePay" 
                                    value={formatInputNumber(savingsPlan.severancePay)} 
                                    onChange={onSavingsPlanChange} 
                                    onFocus={onFocus} 
                                />
                            </div>
                        </td>
                        <td>{formatNumber(savingsData.riskFreeReturn.baseFund)}</td>
                        <td>{formatNumber(savingsData.riskFreeReturn.shortfall)}</td>
                        <td rowSpan={2}>
                            <div className="input-wrapper-table">
                                <input type="number" name="savingsStartYear" value={savingsPlan.savingsStartYear} onChange={onSavingsPlanChange} onFocus={onFocus} />
                                <span>년 후</span>
                            </div>
                        </td>
                         <td rowSpan={2}>
                            <div className="input-wrapper-table">
                                <input type="number" name="savingsDuration" value={savingsPlan.savingsDuration} onChange={onSavingsPlanChange} onFocus={onFocus} />
                                <span>년 간</span>
                            </div>
                        </td>
                        <td style={{textAlign: 'center'}}>
                           <span>{(Number(savingsData.riskFreeReturn.rate) || 0).toFixed(1)}%</span>
                        </td>
                        <td className="highlight-yellow">{formatNumber(savingsData.riskFreeReturn.fixedMonthlySaving)}</td>
                        <td rowSpan={2}>{formatYears(savingsData.deferralPeriod)}</td>
                    </tr>
                    <tr>
                        <td className="row-label">기대수익률</td>
                        <td>{formatNumber(savingsData.expectedReturn.baseFund)}</td>
                        <td>{formatNumber(savingsData.expectedReturn.shortfall)}</td>
                        <td>
                            <div className="input-wrapper-table">
                                <input type="number" name="expectedReturn" value={savingsPlan.expectedReturn} onChange={onSavingsPlanChange} onFocus={onFocus} step={0.1} />
                                <span>%</span>
                            </div>
                        </td>
                        <td className="highlight-yellow">{formatNumber(savingsData.expectedReturn.fixedMonthlySaving)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const AnalysisResults = ({ data, person, assumptions, onTotalValueCalculated, savingsData, savingsPlan, onSavingsPlanChange, onFocus }) => {
    if (!data) return null;

    const { ages } = data;

    const formatCurrency = useCallback((value: number) => {
        if (isNaN(value) || !isFinite(value)) return 'N/A';
        return `${Math.round(value).toLocaleString('ko-KR')}만원`;
    }, []);
    
    const { milestones, durationLabels } = useMemo(() => {
        const allMilestonesRaw = [
            { label: '은퇴', age: ages.retirement },
            { label: '본인', age: ages.myPensionStartAge },
            { label: '배우자', age: ages.spousePensionStartAge },
            { label: '본인사망', age: ages.myDeath },
            { label: '배우자사망', age: ages.spouseDeath },
        ];

        const sortedMilestonesRaw = [...allMilestonesRaw].sort((a, b) => a.age - b.age);

        const timelineStartAge = sortedMilestonesRaw[0]?.age ?? 0;
        const timelineEndAge = sortedMilestonesRaw[sortedMilestonesRaw.length - 1]?.age ?? 100;
        const totalDurationYears = timelineEndAge - timelineStartAge;
        const isValidDuration = totalDurationYears > 0;

        const pensionMilestoneLabels = ['은퇴', '본인', '배우자'];
        const pensionMilestonesOnTimelineRaw = sortedMilestonesRaw.filter(m => pensionMilestoneLabels.includes(m.label));
        const splitAge = pensionMilestonesOnTimelineRaw.length > 0
            ? Math.max(...pensionMilestonesOnTimelineRaw.map(m => m.age))
            : -1;

        const calculatePosition = (age: number) => {
            if (!isValidDuration || totalDurationYears <= 0) return 0;

            const useSplitTimeline = splitAge !== -1 && splitAge < timelineEndAge;

            if (!useSplitTimeline) {
                const proportion = (age - timelineStartAge) / totalDurationYears;
                return Math.max(0, Math.min(100, proportion * 100));
            }

            const duration1 = splitAge - timelineStartAge;
            const duration2 = timelineEndAge - splitAge;

            if (age <= splitAge) {
                if (duration1 === 0) {
                    return 50;
                }
                const proportion = (age - timelineStartAge) / duration1;
                return Math.max(0, Math.min(50, proportion * 50));
            } else {
                const proportion = (age - splitAge) / duration2;
                return Math.max(50, Math.min(100, 50 + (proportion * 50)));
            }
        };
        
        const milestonesWithGroupedLabels = sortedMilestonesRaw.reduce((acc: { age: number, labels: string[] }[], milestone) => {
            const lastGroup = acc.length > 0 ? acc[acc.length - 1] : null;
            if (lastGroup && lastGroup.age === milestone.age) {
                if (!lastGroup.labels.includes(milestone.label)) {
                    lastGroup.labels.push(milestone.label);
                }
            } else {
                acc.push({ age: milestone.age, labels: [milestone.label] });
            }
            return acc;
        }, []);

        const milestonesResult = milestonesWithGroupedLabels.map(m => {
            const originalPos = calculatePosition(m.age);
            const pos = m.labels.includes('본인사망')
                ? Math.max(0, originalPos - 2.5)
                : originalPos;

            return {
                ...m,
                pos,
            };
        });

        const durationLabelsResult = [];
        for (let i = 0; i < milestonesResult.length - 1; i++) {
            const start = milestonesResult[i];
            const end = milestonesResult[i + 1];
            const duration = end.age - start.age;
            if (duration > 0) {
                durationLabelsResult.push({
                    label: `${duration}년`,
                    pos: (start.pos + end.pos) / 2
                });
            }
        }
        return { milestones: milestonesResult, durationLabels: durationLabelsResult };
    }, [ages]);
    
    const periodAnalysis = useMemo(() => {
        const expenses = [];
        const presentValuesRaw = [];

        const baseMonthlyExpenseNow = Number(person.retirementLivingExpenses) || 0;
        const myPensionAmountNow = Number(person.myPensionAmount) || 0;
        const spousePensionAmountNow = Number(person.spousePensionAmount) || 0;
        
        const preRetirementInflation = (Number(assumptions.preRetirementInflation) || 0) / 100;
        const postRetirementInflation = (Number(assumptions.postRetirementInflation) || 0) / 100;
        const postRetirementReturn = (Number(assumptions.postRetirementReturn) || 0) / 100;
        const preRetirementReturn = (Number(assumptions.preRetirementReturn) || 0) / 100;

        const baseMonthlyExpenseAtRetirement = baseMonthlyExpenseNow;
        
        const spouseExpenseAtMyDeath = (baseMonthlyExpenseAtRetirement * ((Number(person.spouseExpensesPercentage) || 0) / 100));
        
        const realPostRetirementReturn = postRetirementInflation === -1 ? -1 : (1 + postRetirementReturn) / (1 + postRetirementInflation) - 1;

        const getPV = (rate: number, nper: number, pmt: number) => {
            if (rate === 0) return pmt * nper;
            if (nper <= 0) return 0;
            return pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
        };

        let myPensionAtRetirement = myPensionAmountNow;
        if (ages.myPensionStartAge < ages.retirement) {
            const yearsToCompound = ages.retirement - ages.myPensionStartAge;
            myPensionAtRetirement *= Math.pow(1 + preRetirementReturn, yearsToCompound);
        }

        let spousePensionAtRetirement = spousePensionAmountNow;
        if (ages.spousePensionStartAge < ages.retirement) {
            const yearsToCompound = ages.retirement - ages.spousePensionStartAge;
            spousePensionAtRetirement *= Math.pow(1 + preRetirementReturn, yearsToCompound);
        }

        let totalRequiredAtRetirement = 0;
        
        for (let i = 0; i < milestones.length - 1; i++) {
            const startMilestone = milestones[i];
            const endMilestone = milestones[i + 1];
            const periodStartAge = startMilestone.age;
            const duration = endMilestone.age - startMilestone.age;

            if (duration <= 0) continue;
            if (periodStartAge < ages.retirement) continue;

            const grossMonthlyExpense = periodStartAge < ages.myDeath ? baseMonthlyExpenseAtRetirement : spouseExpenseAtMyDeath;

            let totalMonthlyPension = 0;
            if (periodStartAge >= ages.myPensionStartAge && periodStartAge < ages.myDeath) {
                totalMonthlyPension += myPensionAtRetirement;
            }
            if (periodStartAge >= ages.spousePensionStartAge && periodStartAge < ages.spouseDeath) {
                totalMonthlyPension += spousePensionAtRetirement;
            }

            const netMonthlyExpense = grossMonthlyExpense - totalMonthlyPension;
            const annualNetExpense = netMonthlyExpense * 12;

            const presentValueForPeriod = getPV(realPostRetirementReturn, duration, annualNetExpense);
            
            const yearsFromRetirement = periodStartAge - ages.retirement;
            let valueAtRetirement = presentValueForPeriod;
            if (yearsFromRetirement > 0) {
                valueAtRetirement /= Math.pow(1 + realPostRetirementReturn, yearsFromRetirement);
            }
            totalRequiredAtRetirement += valueAtRetirement;
            
            expenses.push({
                label: formatCurrency(netMonthlyExpense),
                pos: (startMilestone.pos + endMilestone.pos) / 2
            });

            presentValuesRaw.push({
                value: presentValueForPeriod,
                age: periodStartAge,
                pos: startMilestone.pos
            });
        }
        
        const yearsToRetirement = data.durations.nowToRetirement;
        const totalFutureValue = totalRequiredAtRetirement * Math.pow(1 + preRetirementInflation, yearsToRetirement);

        const presentValues = presentValuesRaw.map(pv => ({
            value: formatCurrency(pv.value),
            age: pv.age,
            pos: pv.pos
        }));

        return { expenses, presentValues, totalFutureValue };
    }, [person, milestones, ages, formatCurrency, assumptions, data.durations.nowToRetirement]);
    
    useEffect(() => {
        if (onTotalValueCalculated) {
            onTotalValueCalculated(periodAnalysis.totalFutureValue);
        }
    }, [periodAnalysis.totalFutureValue, onTotalValueCalculated]);


    const analysisContainerRef = useRef<HTMLDivElement>(null);
    const expenseBoxRefs = useRef<(HTMLDivElement | null)[]>([]);
    const pvBoxRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [pvArrows, setPvArrows] = useState<any[]>([]);

    expenseBoxRefs.current = [];
    pvBoxRefs.current = [];

    const recalculatePvArrows = useCallback(() => {
        const containerEl = analysisContainerRef.current;
        if (!containerEl) return;
        const containerRect = containerEl.getBoundingClientRect();

        const newArrows = periodAnalysis.presentValues.map((_, index) => {
            const expenseEl = expenseBoxRefs.current[index];
            const pvEl = pvBoxRefs.current[index];
            if (expenseEl && pvEl) {
                const expenseRect = expenseEl.getBoundingClientRect();
                const pvRect = pvEl.getBoundingClientRect();

                const x1 = (expenseRect.left + expenseRect.width / 2) - containerRect.left;
                const y1 = expenseRect.bottom - containerRect.top;
                const y2 = (pvRect.top + pvRect.height / 2) - containerRect.top;
                const pvLeftX = pvRect.left - containerRect.left;
                const pvRightX = pvRect.right - containerRect.left;
                const x2 = Math.abs(x1 - pvLeftX) < Math.abs(x1 - pvRightX) ? pvLeftX : pvRightX;
                const points = `${x1},${y1} ${x1},${y2} ${x2},${y2}`;
                
                return { points, show: true };
            }
            return { show: false };
        });
        setPvArrows(newArrows);
    }, [periodAnalysis.presentValues]);

    useLayoutEffect(() => {
        recalculatePvArrows();
    }, [periodAnalysis, recalculatePvArrows]);

    useEffect(() => {
        window.addEventListener('resize', recalculatePvArrows);
        return () => {
            window.removeEventListener('resize', recalculatePvArrows);
        };
    }, [recalculatePvArrows]);

    return (
        <section className="analysis-section" aria-labelledby="analysis-heading">
            <div className="analysis-header">
                <h2 id="analysis-heading">은퇴자금 정밀분석(국민연금 감안)</h2>
            </div>
            <div className="analysis-card">
                <div className="analysis-timeline-container">
                    <div className="analysis-timeline-bar"></div>
                    <div className="analysis-timeline-content" ref={analysisContainerRef}>
                        {milestones.map(m => {
                            const pensionLabels = ['본인', '배우자'];
                            const topLabels = m.labels.filter(l => !pensionLabels.includes(l));
                            const bottomLabels = m.labels.filter(l => pensionLabels.includes(l));

                            return (
                                <div className="analysis-milestone" key={m.age} style={{ left: `${m.pos}%` }}>
                                    {topLabels.length > 0 && (
                                        <span className="milestone-label">
                                            {topLabels.map((label, index) => (
                                                <React.Fragment key={label}>
                                                    {label}
                                                    {index < topLabels.length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </span>
                                    )}
                                    <div className="milestone-dot"></div>
                                    <span className="milestone-age">{m.age}세</span>
                                    {bottomLabels.length > 0 && (
                                        <span className="milestone-label is-bottom">
                                            {bottomLabels.map((label, index) => (
                                                <React.Fragment key={label}>
                                                    {label}
                                                    {index < bottomLabels.length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                        {durationLabels.map((d, index) => (
                           <div className="analysis-duration" key={index} style={{ left: `${d.pos}%` }}>
                                {d.label}
                            </div>
                        ))}
                        <div className="analysis-expenses-container">
                            {periodAnalysis.expenses.map((e, index) => (
                                <div ref={el => { expenseBoxRefs.current[index] = el; }} className="analysis-expense-box" key={index} style={{ left: `${e.pos}%` }}>
                                    {e.label}
                                </div>
                            ))}
                        </div>
                         <div className="analysis-pv-container">
                            {periodAnalysis.presentValues.map((pv, index) => (
                                <div className="analysis-pv-group" key={index} style={{ left: `${pv.pos}%` }}>
                                    <div ref={el => { pvBoxRefs.current[index] = el; }} className="analysis-pv-box">
                                        <span className="pv-value">{pv.value}</span>
                                    </div>
                                     {index === 0 && periodAnalysis.totalFutureValue > 0 && (
                                        <div className="total-pv-box is-summary">
                                            <span className="pv-value total-pv-value">
                                                {formatCurrency(periodAnalysis.totalFutureValue)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <svg className="analysis-arrow-connector">
                            <defs>
                                <marker id="analysis-arrowhead" markerWidth="5" markerHeight="3.5" refX="5" refY="1.75" orient="auto">
                                    <path d="M 0 0 L 5 1.75 L 0 3.5 z" />
                                </marker>
                            </defs>
                            {pvArrows.map((arrow, index) => (
                                arrow.show && (
                                    <g key={index}>
                                        <polyline
                                            points={arrow.points}
                                            fill="none"
                                            markerEnd="url(#analysis-arrowhead)"
                                        />
                                    </g>
                                )
                            ))}
                        </svg>
                    </div>
                </div>
                <div className="total-fund-wrapper">
                    <SavingsPlanTable
                        savingsData={savingsData}
                        savingsPlan={savingsPlan}
                        onSavingsPlanChange={onSavingsPlanChange}
                        onFocus={onFocus}
                    />
                </div>
            </div>
        </section>
    );
};


const App = () => {
    const [person, setPerson] = useState({
        myAge: 30,
        myRetirementAge: 65,
        myLifeExpectancy: 85,
        myPensionStartAge: 65,
        myPensionAmount: 80,
        retirementLivingExpenses: 250,
        spouseAge: 28,
        spouseRetirementAge: 63,
        spouseLifeExpectancy: 90,
        spousePensionStartAge: 65,
        spousePensionAmount: 70,
        spouseExpensesPercentage: 70,
    });

    const [assumptions, setAssumptions] = useState({
        preRetirementInflation: 2.5,
        riskFreeReturn: 3,
        preRetirementReturn: 6.0,
        postRetirementInflation: 2.0,
        postRetirementReturn: 3.0,
    });

    const [totalFutureValue, setTotalFutureValue] = useState(0);

    const [savingsPlan, setSavingsPlan] = useState({
        severancePay: 0,
        savingsStartYear: 0,
        savingsDuration: 35,
        expectedReturn: 6.0,
    });
    
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleSaveAsPdf = async () => {
        if (!window.html2canvas || !window.jspdf) {
            alert('PDF generation library is not loaded. Please try again.');
            return;
        }

        setIsGeneratingPdf(true);
        const appHeader = document.querySelector('.app-header');
        if (appHeader) (appHeader as HTMLElement).style.display = 'none';

        const input = document.querySelector('.container');

        if (!input) {
            console.error('Container element not found');
            if (appHeader) (appHeader as HTMLElement).style.display = 'flex';
            setIsGeneratingPdf(false);
            return;
        }

        try {
            window.scrollTo(0, 0);
            const canvas = await window.html2canvas(input as HTMLElement, {
                scale: 2, // for better quality
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = imgProps.width;
            const imgHeight = imgProps.height;
            
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            const widthToPrint = imgWidth * ratio;
            const heightToPrint = imgHeight * ratio;
            const xOffset = (pdfWidth - widthToPrint) / 2;
            
            pdf.addImage(imgData, 'PNG', xOffset, 0, widthToPrint, heightToPrint);
            pdf.save('retirement-plan.pdf');

        } catch (error) {
            console.error('Could not generate PDF', error);
            alert('An error occurred while generating the PDF.');
        } finally {
            if (appHeader) (appHeader as HTMLElement).style.display = 'flex';
            setIsGeneratingPdf(false);
        }
    };

    const handleSavingsPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
    
        if (value === '') {
            setSavingsPlan(prev => ({ ...prev, [name]: '' }));
            return;
        }
    
        let numericValue;
        if (name === 'severancePay') {
            numericValue = parseInt(value.replace(/,/g, ''), 10);
        } else {
            numericValue = Number(value);
        }
        
        if (!isNaN(numericValue)) {
            setSavingsPlan(prev => ({ ...prev, [name]: numericValue }));
        }
    };

    const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPerson(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleAssumptionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAssumptions(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const financialData = useMemo(() => {
        const myAge = Number(person.myAge) || 0;
        const spouseAge = Number(person.spouseAge) || 0;
        const myRetirementAge = Number(person.myRetirementAge) || 0;
        const myLifeExpectancy = Number(person.myLifeExpectancy) || 0;
        const spouseLifeExpectancy = Number(person.spouseLifeExpectancy) || 0;
        const myPensionStartAge = Number(person.myPensionStartAge) || 0;
        const spousePensionStartAge = Number(person.spousePensionStartAge) || 0;
        const myPensionAmount = Number(person.myPensionAmount) || 0;
        const spousePensionAmount = Number(person.spousePensionAmount) || 0;
        const retirementLivingExpenses = Number(person.retirementLivingExpenses) || 0;
        const spouseExpensesPercentage = Number(person.spouseExpensesPercentage) || 0;

        const preRetirementInflation = (Number(assumptions.preRetirementInflation) || 0) / 100;
        const riskFreeReturn = (Number(assumptions.riskFreeReturn) || 0) / 100;
        const preRetirementReturn = (Number(assumptions.preRetirementReturn) || 0) / 100;
        const postRetirementInflation = (Number(assumptions.postRetirementInflation) || 0) / 100;
        const postRetirementReturn = (Number(assumptions.postRetirementReturn) || 0) / 100;

        const now = myAge;
        const retirement = myRetirementAge;
        const myDeath = myLifeExpectancy;
        const spouseDeath = myAge - spouseAge + spouseLifeExpectancy;
        const timelineSpousePensionStartAge = myAge - spouseAge + spousePensionStartAge;

        const durationNowToRetirement = Math.max(0, retirement - now);
        const durationRetirementToMyDeath = Math.max(0, myDeath - retirement);
        const durationMyDeathToSpouseDeath = Math.max(0, spouseDeath - myDeath);
        
        const annualLivingExpensesNow = retirementLivingExpenses * 12;
        const futureAnnualLivingExpenses = annualLivingExpensesNow * Math.pow(1 + preRetirementInflation, durationNowToRetirement);
        const livingExpensesAtMyDeath = futureAnnualLivingExpenses * Math.pow(1 + postRetirementInflation, durationRetirementToMyDeath);

        const getPV = (rate: number, nper: number, pmt: number) => {
            if (rate === 0) return pmt * nper;
            if (nper <= 0) return 0;
            return pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
        };
        
        const realPostRetirementReturn = postRetirementInflation === -1 ? -1 : (1 + postRetirementReturn) / (1 + postRetirementInflation) - 1;

        const expensesPeriod1 = futureAnnualLivingExpenses;
        const capitalForPeriod1 = getPV(realPostRetirementReturn, durationRetirementToMyDeath, expensesPeriod1);
        const expensesPeriod2 = livingExpensesAtMyDeath * (spouseExpensesPercentage / 100);
        const requiredCapitalAtMyDeath = getPV(realPostRetirementReturn, durationMyDeathToSpouseDeath, expensesPeriod2);
        const capitalForPeriod2AtRetirement = requiredCapitalAtMyDeath / Math.pow(1 + postRetirementReturn, durationRetirementToMyDeath);
        const requiredGross = capitalForPeriod1 + capitalForPeriod2AtRetirement;

        const pmt = (rate: number, nper: number, fv: number) => {
            if (rate === 0) return fv / nper;
            if (nper <= 0 || fv <= 0) return 0;
            return (fv * rate) / (Math.pow(1 + rate, nper) - 1);
        };

        const nperMonthly = durationNowToRetirement * 12;
        const riskFreeMonthly = riskFreeReturn / 12;
        const preRetirementMonthly = preRetirementReturn / 12;
        
        const monthlySavingsRiskFree = pmt(riskFreeMonthly, nperMonthly, requiredGross);
        const monthlySavingsExpected = pmt(preRetirementMonthly, nperMonthly, requiredGross);

        return {
            ages: { now, retirement, myDeath, spouseDeath, myPensionStartAge, spousePensionStartAge: timelineSpousePensionStartAge },
            durations: { nowToRetirement: durationNowToRetirement, retirementToMyDeath: durationRetirementToMyDeath, myDeathToSpouseDeath: durationMyDeathToSpouseDeath },
            calculations: { annualLivingExpensesNow, futureAnnualLivingExpenses, livingExpensesAtMyDeath },
            capitalBreakdown: {
                period1: capitalForPeriod1,
                period2Discounted: capitalForPeriod2AtRetirement,
                total: requiredGross
            },
            requiredCapitalAtMyDeath: requiredCapitalAtMyDeath,
            monthlySavings: {
                riskFree: monthlySavingsRiskFree,
                expected: monthlySavingsExpected
            }
        };
    }, [person, assumptions]);
    
    const savingsData = useMemo(() => {
        const durationNowToRetirement = financialData.durations.nowToRetirement;

        const requiredFund = totalFutureValue;
        const severancePay = Number(savingsPlan.severancePay) || 0;
        const savingsStartYear = Number(savingsPlan.savingsStartYear) || 0;
        const savingsDurationYears = Number(savingsPlan.savingsDuration) || 0;
        
        const deferralPeriod = Math.max(0, durationNowToRetirement - savingsStartYear - savingsDurationYears);

        const calculateScenario = (returnRate) => {
            const baseFund = severancePay * Math.pow(1 + returnRate, durationNowToRetirement);
            const shortfall = Math.max(0, requiredFund - baseFund);

            const monthlyReturn = returnRate / 12;
            const savingsDurationMonths = savingsDurationYears * 12;

            const fvAnnuityFactor = (rate, nper) => {
                if (rate === 0) return nper;
                return (Math.pow(1 + rate, nper) - 1) / rate;
            };

            const growthDuringDeferral = Math.pow(1 + returnRate, deferralPeriod);
            const fvAnnuityAtEndOfSavings = fvAnnuityFactor(monthlyReturn, savingsDurationMonths);
            const totalFactor = fvAnnuityAtEndOfSavings * growthDuringDeferral;
            const fixedMonthlySaving = totalFactor > 0 ? shortfall / totalFactor : 0;
            
            return { baseFund, shortfall, fixedMonthlySaving };
        };

        const expectedReturnRate = (Number(savingsPlan.expectedReturn) || 0) / 100;
        const riskFreeReturnRate = (Number(assumptions.riskFreeReturn) || 0) / 100;

        return {
            requiredFund,
            deferralPeriod,
            riskFreeReturn: {
                rate: assumptions.riskFreeReturn,
                ...calculateScenario(riskFreeReturnRate)
            },
            expectedReturn: {
                rate: savingsPlan.expectedReturn,
                ...calculateScenario(expectedReturnRate)
            },
        };
    }, [totalFutureValue, savingsPlan, financialData.durations.nowToRetirement, assumptions.riskFreeReturn]);


    const assumptionFields = [
        { name: 'preRetirementInflation', label: '은퇴전물가', unit: '%', step: 0.1 },
        { name: 'riskFreeReturn', label: '무위험수익률', unit: '%', step: 0.1 },
        { name: 'preRetirementReturn', label: '기대수익률', unit: '%', step: 0.1 },
        { name: 'postRetirementInflation', label: '은퇴후물가', unit: '%', step: 0.1 },
        { name: 'postRetirementReturn', label: '은퇴후수익률', unit: '%', step: 0.1 },
    ];
    
    const myFields = [
        { key: 'myAge', label: '나이', unit: '세' },
        { key: 'myRetirementAge', label: '은퇴시점', unit: '세' },
        { key: 'myLifeExpectancy', label: '기대여명', unit: '세' },
        { key: 'myPensionStartAge', label: '국민연금', unit: '세' },
        { key: 'myPensionAmount', label: '예상수령액', unit: '만원' },
        { key: 'retirementLivingExpenses', label: '은퇴생활비', unit: '만원' },
    ];
    
    const spouseFields = [
        { key: 'spouseAge', label: '나이', unit: '세' },
        { key: 'spouseRetirementAge', label: '은퇴시점', unit: '세' },
        { key: 'spouseLifeExpectancy', label: '기대여명', unit: '세' },
        { key: 'spousePensionStartAge', label: '국민연금', unit: '세' },
        { key: 'spousePensionAmount', label: '예상수령액', unit: '만원' },
        { key: 'spouseExpensesPercentage', label: '생활비', unit: '%' },
    ];
    
    const nowCalcRef = useRef<HTMLDivElement>(null);
    const retirementCalcRef = useRef<HTMLDivElement>(null);
    const myDeathCalcRef = useRef<HTMLDivElement>(null);
    const capitalPeriod2Ref = useRef<HTMLDivElement>(null);
    const capitalMyDeathRef = useRef<HTMLDivElement>(null);
    const timelineEventsRef = useRef<HTMLDivElement>(null);
    const capitalRiskFreeRef = useRef<HTMLDivElement>(null);
    const capitalExpectedRef = useRef<HTMLDivElement>(null);
    const capitalTotalRequiredRef = useRef<HTMLDivElement>(null);

    const [arrowCoords, setArrowCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, show: false });
    const [arrow2Coords, setArrow2Coords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, show: false });
    const [arrow3Coords, setArrow3Coords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, show: false });
    const [arrow4Coords, setArrow4Coords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, show: false });
    const [arrow5Coords, setArrow5Coords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, show: false });

    const recalculateArrows = useCallback(() => {
        const calculateArrowCoords = (startRef, endRef, startSide = 'right', startVAlign = 'center', endSide = 'left', endVAlign = 'center') => {
            const startEl = startRef.current;
            const endEl = endRef.current;
            const containerEl = timelineEventsRef.current?.parentElement;

            if (startEl && endEl && containerEl) {
                const containerRect = containerEl.getBoundingClientRect();
                const startRect = startEl.getBoundingClientRect();
                const endRect = endEl.getBoundingClientRect();

                const getCoords = (rect, side, vAlign) => {
                    let x, y;
                    if (vAlign === 'top') y = rect.top;
                    else if (vAlign === 'bottom') y = rect.bottom;
                    else y = rect.top + rect.height / 2;

                    if (side === 'left') x = rect.left;
                    else if (side === 'right') x = rect.right;
                    else x = rect.left + rect.width / 2;

                    return { x: x - containerRect.left, y: y - containerRect.top };
                };

                const start = getCoords(startRect, startSide, startVAlign);
                const end = getCoords(endRect, endSide, endVAlign);
                
                return {
                    x1: start.x, y1: start.y, x2: end.x, y2: end.y,
                    textX: (start.x + end.x) / 2, textY: (start.y + end.y) / 2,
                    show: true
                };
            }
            return { x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, show: false };
        };

        setArrowCoords(calculateArrowCoords(nowCalcRef, retirementCalcRef, 'right', 'center', 'left', 'center'));
        setArrow2Coords(calculateArrowCoords(retirementCalcRef, myDeathCalcRef, 'right', 'center', 'left', 'center'));
        setArrow3Coords(calculateArrowCoords(capitalMyDeathRef, capitalPeriod2Ref, 'center', 'bottom', 'right', 'center'));
        setArrow4Coords(calculateArrowCoords(capitalTotalRequiredRef, capitalRiskFreeRef, 'left', 'center', 'right', 'center'));
        setArrow5Coords(calculateArrowCoords(capitalTotalRequiredRef, capitalExpectedRef, 'center', 'bottom', 'right', 'center'));
    }, []);

    useLayoutEffect(() => {
        recalculateArrows();
    }, [financialData, recalculateArrows]);

    useEffect(() => {
        window.addEventListener('resize', recalculateArrows);
        return () => {
            window.removeEventListener('resize', recalculateArrows);
        };
    }, [recalculateArrows]);


    const formatCurrency = (value: number) => {
        if (isNaN(value) || !isFinite(value)) return 'N/A';
        return `${Math.round(value).toLocaleString('ko-KR')}만원`;
    };

    return (
        <div className="container">
            <div className="app-header">
                <h1>은퇴 설계 시뮬레이터</h1>
                <button onClick={handleSaveAsPdf} disabled={isGeneratingPdf} className="pdf-button">
                    {isGeneratingPdf ? '저장 중...' : 'PDF로 저장'}
                </button>
            </div>

            <section className="main-content">
                <h2>기본 정보</h2>
                <div className="info-section-container">
                    <div className="form-grid">
                        {assumptionFields.map(field => (
                            <div key={field.name} className="form-group">
                                <label htmlFor={field.name}>{field.label}</label>
                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        id={field.name}
                                        name={field.name}
                                        value={assumptions[field.name]}
                                        onChange={handleAssumptionsChange}
                                        onFocus={handleFocus}
                                        step={field.step || 1}
                                    />
                                    <span>{field.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="info-row">
                        <h3 className="info-row-label">본인</h3>
                        <div className="form-grid">
                            {myFields.map(field => (
                                <div key={field.key} className="form-group">
                                    <label htmlFor={field.key}>{field.label}</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            id={field.key}
                                            name={field.key}
                                            value={person[field.key]}
                                            onChange={handlePersonChange}
                                            onFocus={handleFocus}
                                        />
                                        <span>{field.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="info-row">
                        <h3 className="info-row-label">배우자</h3>
                        <div className="form-grid">
                            {spouseFields.map(field => (
                                <div key={field.key} className="form-group no-label">
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            id={field.key}
                                            name={field.key}
                                            value={person[field.key]}
                                            onChange={handlePersonChange}
                                            onFocus={handleFocus}
                                        />
                                        <span>{field.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            
            <section className="timeline-section">
                <h2 id="timeline-heading">은퇴자금 타임라인(국민연금 감안 전)</h2>
                <div className="timeline-container">
                    <div className="timeline-content-wrapper">
                        <div className="timeline-arrow"></div>
                        <div className="timeline-durations">
                            <div className="timeline-duration">{financialData.durations.nowToRetirement}년</div>
                            <div className="timeline-duration">{financialData.durations.retirementToMyDeath}년</div>
                            <div className="timeline-duration">{financialData.durations.myDeathToSpouseDeath}년</div>
                        </div>
                        <div className="timeline-events" ref={timelineEventsRef}>
                            {Object.entries({
                                '현재': { age: financialData.ages.now, calc: financialData.calculations.annualLivingExpensesNow, ref: nowCalcRef },
                                '은퇴': { age: financialData.ages.retirement, calc: financialData.calculations.futureAnnualLivingExpenses, ref: retirementCalcRef, class: 'future-value' },
                                '본인사망': { age: financialData.ages.myDeath, calc: financialData.calculations.livingExpensesAtMyDeath, ref: myDeathCalcRef, class: 'highest-value' },
                                '배우자사망': { age: financialData.ages.spouseDeath },
                            }).map(([label, data]) => (
                                <div key={label} className="timeline-event">
                                    {data.calc !== undefined && (
                                        <div ref={data.ref} className={`event-calculation ${data.class || ''}`}>
                                            {formatCurrency(data.calc)}
                                        </div>
                                    )}
                                    <span className="event-label">{label}</span>
                                    <div className="event-dot"></div>
                                    <span className="event-age">{data.age}세</span>
                                </div>
                            ))}
                        </div>
                         <div className="timeline-capital-container">
                             <div className="capital-boxes-wrapper">
                                <div className="event-required-capital now-capital">
                                     <div ref={capitalRiskFreeRef} className="capital-box">
                                        {formatCurrency(financialData.monthlySavings.riskFree)}
                                    </div>
                                    <div ref={capitalExpectedRef} className="capital-box">
                                        {formatCurrency(financialData.monthlySavings.expected)}
                                    </div>
                                </div>
                                <div className="event-required-capital retirement-capital">
                                    <div className="capital-box">
                                        {formatCurrency(financialData.capitalBreakdown.period1)}
                                    </div>
                                    <div ref={capitalPeriod2Ref} className="capital-box">
                                        {formatCurrency(financialData.capitalBreakdown.period2Discounted)}
                                    </div>
                                    <div ref={capitalTotalRequiredRef} className="capital-box total-required-capital">
                                        {formatCurrency(financialData.capitalBreakdown.total)}
                                    </div>
                                </div>
                                <div className="event-required-capital my-death-capital">
                                    <div ref={capitalMyDeathRef} className="capital-box">
                                        {formatCurrency(financialData.requiredCapitalAtMyDeath)}
                                    </div>
                                </div>
                             </div>
                        </div>
                        <svg className="timeline-arrow-connector">
                            <defs>
                                <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="5" refY="1.75" orient="auto">
                                    <path d="M 0 0 L 5 1.75 L 0 3.5 z" />
                                </marker>
                            </defs>
                            {arrowCoords.show && (
                                <g>
                                    <line x1={arrowCoords.x1} y1={arrowCoords.y1} x2={arrowCoords.x2} y2={arrowCoords.y2} markerEnd="url(#arrowhead)" />
                                    <text x={arrowCoords.textX} y={arrowCoords.y1 - 10} className="arrow-label">
                                        {(Number(assumptions.preRetirementInflation) || 0).toFixed(1)}%
                                    </text>
                                </g>
                            )}
                            {arrow2Coords.show && (
                                <g>
                                    <line x1={arrow2Coords.x1} y1={arrow2Coords.y1} x2={arrow2Coords.x2} y2={arrow2Coords.y2} markerEnd="url(#arrowhead)" />
                                     <text x={arrow2Coords.textX} y={arrow2Coords.y1 - 10} className="arrow-label">
                                        {(Number(assumptions.postRetirementInflation) || 0).toFixed(1)}%
                                    </text>
                                </g>
                            )}
                             {arrow3Coords.show && (
                                <g>
                                    <polyline
                                        points={`${arrow3Coords.x1},${arrow3Coords.y1} ${arrow3Coords.x1},${arrow3Coords.y2} ${arrow3Coords.x2},${arrow3Coords.y2}`}
                                        fill="none"
                                        markerEnd="url(#arrowhead)"
                                    />
                                    <text x={(arrow3Coords.x1 + arrow3Coords.x2) / 2} y={arrow3Coords.y2 - 10} className="arrow-label">
                                        {(Number(assumptions.postRetirementReturn) || 0).toFixed(1)}%
                                    </text>
                                </g>
                            )}
                            {arrow4Coords.show && (
                                <g>
                                    <line x1={arrow4Coords.x1} y1={arrow4Coords.y1} x2={arrow4Coords.x2} y2={arrow4Coords.y2} markerEnd="url(#arrowhead)" />
                                     <text x={arrow4Coords.textX} y={arrow4Coords.y1 - 10} className="arrow-label">
                                        {(Number(assumptions.riskFreeReturn) || 0).toFixed(1)}%
                                    </text>
                                </g>
                            )}
                            {arrow5Coords.show && (
                                <g>
                                    <polyline
                                        points={`${arrow5Coords.x1},${arrow5Coords.y1} ${arrow5Coords.x1},${arrow5Coords.y2} ${arrow5Coords.x2},${arrow5Coords.y2}`}
                                        fill="none"
                                        markerEnd="url(#arrowhead)"
                                    />
                                    <text x={(arrow5Coords.x1 + arrow5Coords.x2) / 2} y={arrow5Coords.y2 - 10} className="arrow-label">
                                        {(Number(assumptions.preRetirementReturn) || 0).toFixed(1)}%
                                    </text>
                                </g>
                            )}
                        </svg>
                    </div>
                </div>
            </section>
            
            <AnalysisResults
                data={financialData}
                person={person}
                assumptions={assumptions}
                onTotalValueCalculated={setTotalFutureValue}
                savingsData={savingsData}
                savingsPlan={savingsPlan}
                onSavingsPlanChange={handleSavingsPlanChange}
                onFocus={handleFocus}
            />

        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);