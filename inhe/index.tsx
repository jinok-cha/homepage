// --- Type Definitions for PDF Libraries ---
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

const checkLibrariesAndInitialize = () => {
    const savePdfBtn = document.getElementById('save-pdf-btn') as HTMLButtonElement;
    let attempts = 0;
    const maxAttempts = 50; // Try for 5 seconds

    const interval = setInterval(() => {
        if (window.html2canvas && window.jspdf) {
            clearInterval(interval);
            initializeApp();
        } else {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                console.error("PDF generation libraries could not be loaded.");
                if (savePdfBtn) {
                    savePdfBtn.textContent = "PDF 저장 불가";
                    savePdfBtn.disabled = true;
                    alert("PDF 저장 기능을 불러오지 못했습니다. 광고 차단기를 비활성화하거나 네트워크 연결을 확인 후 새로고침해주세요.");
                }
            }
        }
    }, 100);
};


const initializeApp = () => {
    // --- Main Calculator DOM Elements ---
    const elements = {
        hasSpouse: document.getElementById('has-spouse') as HTMLInputElement,
        numChildren: document.getElementById('num-children') as HTMLInputElement,
        childrenDecrement: document.getElementById('children-decrement') as HTMLButtonElement,
        childrenIncrement: document.getElementById('children-increment') as HTMLButtonElement,
        stockValue: document.getElementById('stock-value') as HTMLInputElement,
        financialAssets: document.getElementById('financial-assets') as HTMLInputElement,
        realEstate: document.getElementById('real-estate') as HTMLInputElement,
        deemedAssets: document.getElementById('deemed-assets') as HTMLInputElement,
        debt: document.getElementById('debt') as HTMLInputElement,
        totalInheritanceValue: document.getElementById('total-inheritance-value') as HTMLElement,
        financialAssetDeduction: document.getElementById('financial-asset-deduction') as HTMLElement,
        lumpSumDeduction: document.getElementById('lump-sum-deduction') as HTMLElement,
        spouseDeduction: document.getElementById('spouse-deduction') as HTMLElement,
        taxBase: document.getElementById('tax-base') as HTMLElement,
        estimatedTax: document.getElementById('estimated-tax') as HTMLElement,
        savePdfBtn: document.getElementById('save-pdf-btn') as HTMLButtonElement,
    };

    // --- Simulation DOM Elements ---
    const simElements = {
        stockRate: document.getElementById('stock-rate') as HTMLInputElement,
        stockRateDecrement: document.getElementById('stock-rate-decrement') as HTMLButtonElement,
        stockRateIncrement: document.getElementById('stock-rate-increment') as HTMLButtonElement,
        financialRate: document.getElementById('financial-rate') as HTMLInputElement,
        financialRateDecrement: document.getElementById('financial-rate-decrement') as HTMLButtonElement,
        financialRateIncrement: document.getElementById('financial-rate-increment') as HTMLButtonElement,
        realEstateRate: document.getElementById('real-estate-rate') as HTMLInputElement,
        realEstateRateDecrement: document.getElementById('real-estate-rate-decrement') as HTMLButtonElement,
        realEstateRateIncrement: document.getElementById('real-estate-rate-increment') as HTMLButtonElement,
        chartContainer: document.getElementById('chart-container') as HTMLElement,
        detailsTbody: document.getElementById('details-tbody') as HTMLElement,
    };
    
    // --- Second Simulation DOM Elements ---
    const simElements2 = {
        card: document.getElementById('second-simulation-card') as HTMLElement,
        chartContainer: document.getElementById('chart-container-2') as HTMLElement,
        detailsTbody: document.getElementById('details-tbody-2') as HTMLElement,
        yearsPassed: document.getElementById('years-passed') as HTMLInputElement,
    };

    // --- PDF Modal DOM Elements ---
    const pdfModalElements = {
        modal: document.getElementById('pdf-name-modal') as HTMLElement,
        fileNameInput: document.getElementById('pdf-file-name') as HTMLInputElement,
        confirmBtn: document.getElementById('confirm-pdf-name') as HTMLButtonElement,
        cancelBtn: document.getElementById('cancel-pdf-name') as HTMLButtonElement,
    };

    // --- State ---
    const state = {
        hasSpouse: true,
        numChildren: 1,
        stockValue: 30,
        financialAssets: 0,
        realEstate: 0,
        deemedAssets: 0,
        debt: 0,
        stockGrowthRate: 2.5,
        financialGrowthRate: 2.5,
        realEstateGrowthRate: 2.0,
        // State for second simulation
        stockValue2: 0,
        financialAssets2: 0,
        realEstate2: 0,
        deemedAssets2: 0,
        debt2: 0,
        yearsPassed: 0,
        isSecondSimInitialized: false,
    };

    // --- Helper Functions ---
    const getNumberValue = (el: HTMLInputElement | null) => el ? (parseFloat(el.value) || 0) : 0;
    const formatCurrency = (value: number) => `${value.toFixed(1)} 억원`;
    const debounce = (func: (...args: any[]) => void, delay: number) => {
        let timeoutId: number;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => func.apply(null, args), delay);
        };
    };
    
    // --- Reusable Calculation Logic ---
    const calculateSpouseDeduction = (totalAssets: number, hasSpouse: boolean, numChildren: number, returnUncapped = false): number => {
        if (!hasSpouse || numChildren < 0) {
            return 0;
        }
        const spouseRatio = 1.5;
        const childrenRatio = numChildren * 1;
        const totalRatio = spouseRatio + childrenRatio;
        const legalSpouseShare = totalRatio > 0 ? totalAssets * (spouseRatio / totalRatio) : totalAssets;
        
        if (returnUncapped) {
            return legalSpouseShare;
        }
        // 배우자 공제는 최소 5억, 최대 30억 한도 내에서 법정상속분만큼 공제
        return Math.max(5, Math.min(30, legalSpouseShare));
    };

    const calculateInheritance = (totalAssets: number, totalFinancialAssetsForDeduction: number, hasSpouse: boolean, numChildren: number) => {
        // 금융재산공제 (Financial Asset Deduction)
        const financialAssetDeduction = Math.min(totalFinancialAssetsForDeduction * 0.2, 2);
        // 일괄공제 (Lump-sum Deduction)
        const lumpSumDeduction = 5;
        // 배우자 공제 (Spouse Deduction)
        const spouseDeduction = hasSpouse ? calculateSpouseDeduction(totalAssets, hasSpouse, numChildren) : 0;
        
        // 과세표준 (Tax Base)
        const totalDeductions = financialAssetDeduction + lumpSumDeduction + spouseDeduction;
        const taxBase = Math.max(0, totalAssets - totalDeductions);
        
        // 예상 상속세액 (Estimated Tax)
        let estimatedTax = 0;
        if (taxBase > 0) {
            if (taxBase <= 1) estimatedTax = taxBase * 0.1;
            else if (taxBase <= 5) estimatedTax = taxBase * 0.2 - 0.1;
            else if (taxBase <= 10) estimatedTax = taxBase * 0.3 - 0.6;
            else if (taxBase <= 30) estimatedTax = taxBase * 0.4 - 1.6;
            else estimatedTax = taxBase * 0.5 - 4.6;
        }

        return {
            financialAssetDeduction,
            lumpSumDeduction,
            spouseDeduction,
            taxBase,
            estimatedTax: Math.max(0, estimatedTax)
        };
    };
    
    // --- Main Calculator Rendering ---
    const renderCalculator = () => {
        const totalAssets = state.stockValue + state.financialAssets + state.realEstate + state.deemedAssets;
        const totalInheritanceValue = totalAssets - state.debt;
        const totalFinancialAssetsForDeduction = state.stockValue + state.financialAssets;

        const results = calculateInheritance(totalInheritanceValue, totalFinancialAssetsForDeduction, state.hasSpouse, state.numChildren);

        elements.totalInheritanceValue.textContent = formatCurrency(totalInheritanceValue);
        elements.financialAssetDeduction.textContent = formatCurrency(results.financialAssetDeduction);
        elements.lumpSumDeduction.textContent = formatCurrency(results.lumpSumDeduction);
        elements.spouseDeduction.textContent = formatCurrency(results.spouseDeduction);
        elements.taxBase.textContent = formatCurrency(results.taxBase);
        elements.estimatedTax.textContent = formatCurrency(results.estimatedTax);
    };

    // --- Simulation Logic and Rendering ---
    const runSimulations = () => {
        const periods = [0, 10, 20, 30];
        const pow = (base: number, exp: number) => Math.pow(1 + base / 100, exp);

        const simulationData1 = periods.map(years => {
            const futureStock = state.stockValue * pow(state.stockGrowthRate, years);
            const futureFinancial = state.financialAssets * pow(state.financialGrowthRate, years);
            const futureRealEstate = state.realEstate * pow(state.realEstateGrowthRate, years);
            const totalAssets = futureStock + futureFinancial + futureRealEstate + state.deemedAssets - state.debt;
            const totalFinancialAssetsForDeduction = futureStock + futureFinancial;
            const taxResults = calculateInheritance(totalAssets, totalFinancialAssetsForDeduction, state.hasSpouse, state.numChildren);

            return {
                years,
                totalAssets: totalAssets,
                stock: futureStock,
                financial: futureFinancial,
                realEstate: futureRealEstate,
                ...taxResults
            };
        });
        
        // 단기 재상속 포함 비율 계산
        const yearsPassed = state.yearsPassed;
        // 1년 경과 시 10%, 10년 이상 경과 시 100% 포함 (선형 증가)
        const inclusionFactor = yearsPassed <= 0 ? 0 : Math.min(1, yearsPassed / 10);


        const simulationData2 = periods.map(years => {
            // 1차 상속 자산 계산 (1차 시뮬레이션의 해당 년도 데이터 기반)
            const firstSimDataPoint = simulationData1.find(d => d.years === years)!;
            const legalSpouseShare1 = calculateSpouseDeduction(firstSimDataPoint.totalAssets, state.hasSpouse, state.numChildren, true);
            const firstInheritanceAsset = legalSpouseShare1 - firstSimDataPoint.estimatedTax;

            // 2차 시뮬레이션의 자산 가치 계산
            const futureStock2 = state.stockValue2 * pow(state.stockGrowthRate, years);
            const futureFinancial2 = state.financialAssets2 * pow(state.financialGrowthRate, years);
            const futureRealEstate2 = state.realEstate2 * pow(state.realEstateGrowthRate, years);
            
            // 2차 시뮬레이션의 기본 총 자산 (배우자 고유 자산)
            const baseTotalAssets2 = futureStock2 + futureFinancial2 + futureRealEstate2 + state.deemedAssets2 - state.debt2;
            
            // 1차 상속 자산을 포함한 최종 총 상속재산 계산
            const totalAssets2 = baseTotalAssets2 + (firstInheritanceAsset * inclusionFactor);

            // 2차 상속세 계산 (배우자 없음)
            const totalFinancialAssetsForDeduction2 = futureStock2 + futureFinancial2;
            const taxResults2 = calculateInheritance(totalAssets2, totalFinancialAssetsForDeduction2, false, state.numChildren);

            return {
                years,
                totalAssets: totalAssets2,
                stock: futureStock2,
                financial: futureFinancial2,
                realEstate: futureRealEstate2,
                deemedAssets: state.deemedAssets2,
                debt: state.debt2,
                firstInheritanceAsset: firstInheritanceAsset,
                ...taxResults2
            };
        });


        renderChart(simulationData1, simElements.chartContainer);
        renderTable(simulationData1, simElements.detailsTbody, false);
        renderChart(simulationData2, simElements2.chartContainer);
        renderTable(simulationData2, simElements2.detailsTbody, true);
    };
    
    const debouncedRunSimulations = debounce(runSimulations, 400);

    const renderChart = (data: any[], container: HTMLElement) => {
        if (!container) return;
        const maxVal = Math.max(...data.map(d => d.totalAssets), 1);

        container.innerHTML = data.map(d => `
            <div class="chart-bar-group">
                <div class="chart-bars">
                    <div class="chart-bar asset-bar" style="height: ${(d.totalAssets / maxVal) * 100}%">
                        <span class="bar-label">${d.totalAssets.toFixed(1)}</span>
                    </div>
                    <div class="chart-bar tax-bar" style="height: ${(d.estimatedTax / maxVal) * 100}%">
                        <span class="bar-label">${d.estimatedTax.toFixed(1)}</span>
                    </div>
                </div>
                <span class="x-axis-label">${d.years === 0 ? '현재' : `${d.years}년 후`}</span>
            </div>
        `).join('');
    };

    const renderTable = (data: any[], tbody: HTMLElement, isSecondSimulation: boolean) => {
        if (!tbody) return;
        
        const baseRows = [
            { label: '예상 주식가치', key: 'stock' },
            { label: '예상 금융자산', key: 'financial' },
            { label: '예상 부동산', key: 'realEstate' },
            { label: '총 상속재산', key: 'totalAssets' },
            { label: '금융재산공제', key: 'financialAssetDeduction' },
            { label: '일괄공제/기타공제', key: 'lumpSumDeduction' },
            { label: '배우자 공제', key: 'spouseDeduction' },
            { label: '과세표준', key: 'taxBase' },
            { label: '예상 상속세액', key: 'estimatedTax', highlight: true },
        ];

        let rows = [...baseRows];
        const editableKeys = ['stock', 'financial', 'realEstate', 'deemedAssets', 'debt'];

        if (isSecondSimulation) {
            rows.unshift({ label: '1차상속 자산', key: 'firstInheritanceAsset'});
            const realEstateIndex = rows.findIndex(row => row.key === 'realEstate');
            if (realEstateIndex !== -1) {
                rows.splice(realEstateIndex + 1, 0,
                    { label: '간주상속재산', key: 'deemedAssets' },
                    { label: '채무', key: 'debt' }
                );
            }
        }

        tbody.innerHTML = rows.map(row => {
            const classList = [];
            if (row.highlight) classList.push('highlight');
            if (isSecondSimulation && (row.key === 'totalAssets' || row.key === 'firstInheritanceAsset')) {
                classList.push('gray-bg');
            }

            return `
            <tr class="${classList.join(' ')}">
                <td>${row.label}</td>
                ${data.map((d, index) => {
                     if (isSecondSimulation && index === 0 && editableKeys.includes(row.key)) {
                        return `
                            <td>
                                <div class="input-wrapper-table">
                                    <input type="number" class="table-input" data-asset-key="${row.key}" value="${d[row.key].toFixed(1)}">
                                    <span>&nbsp;억원</span>
                                </div>
                            </td>
                        `;
                    }
                    return `<td>${formatCurrency(d[row.key] < 0 ? 0 : d[row.key])}</td>`;
                }).join('')}
            </tr>
        `}).join('');
    };

    // --- PDF Generation Logic ---
    const askForFileName = (): Promise<string | null> => {
        return new Promise((resolve) => {
            const modal = pdfModalElements.modal;
            const input = pdfModalElements.fileNameInput;
            const confirmBtn = pdfModalElements.confirmBtn;
            const cancelBtn = pdfModalElements.cancelBtn;

            input.value = "상속세_계산_결과";
            modal.classList.remove('hidden');
            input.focus();
            input.select();

            const close = (fileName: string | null) => {
                modal.classList.add('hidden');
                // Remove event listeners to prevent memory leaks
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onOverlayClick);
                resolve(fileName);
            };

            const onConfirm = () => {
                const fileName = input.value.trim();
                if (fileName) {
                    close(fileName);
                }
            };

            const onCancel = () => {
                close(null);
            };
            
            const onOverlayClick = (e: MouseEvent) => {
                if(e.target === modal) {
                    close(null);
                }
            };

            confirmBtn.addEventListener('click', onConfirm, { once: true });
            cancelBtn.addEventListener('click', onCancel, { once: true });
            modal.addEventListener('click', onOverlayClick);
        });
    };

    const generateAndSavePdf = async (fileName: string) => {
        const btn = elements.savePdfBtn;
        if (!btn) return;
        
        btn.disabled = true;
        btn.textContent = "저장 중...";

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const cards = document.querySelectorAll('.calculator-card');
            let isFirstPage = true;

            for (const card of Array.from(cards)) {
                if ((card as HTMLElement).style.display === 'none') {
                    continue;
                }
                
                if (!isFirstPage) {
                    pdf.addPage();
                }

                const canvas = await window.html2canvas(card, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');

                const margin = 10;
                const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
                const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2;
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const canvasRatio = canvasWidth / canvasHeight;

                let finalWidth = pdfWidth;
                let finalHeight = pdfWidth / canvasRatio;

                if (finalHeight > pdfHeight) {
                    finalHeight = pdfHeight;
                    finalWidth = pdfHeight * canvasRatio;
                }
                
                const x = margin + (pdfWidth - finalWidth) / 2;
                const y = margin + (pdfHeight - finalHeight) / 2;

                pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
                isFirstPage = false;
            }

            pdf.save(`${fileName}.pdf`);

        } catch (error) {
            console.error("PDF 생성 중 오류가 발생했습니다:", error);
            alert("PDF를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            btn.disabled = false;
            btn.textContent = "PDF로 저장";
        }
    };


    // --- Update and Render All ---
    const updateAndRenderAll = () => {
        // Update state from main calculator
        state.hasSpouse = elements.hasSpouse.checked;
        state.numChildren = getNumberValue(elements.numChildren);
        state.stockValue = getNumberValue(elements.stockValue);
        state.financialAssets = getNumberValue(elements.financialAssets);
        state.realEstate = getNumberValue(elements.realEstate);
        state.deemedAssets = getNumberValue(elements.deemedAssets);
        state.debt = getNumberValue(elements.debt);
        
        // Conditionally show/hide the second simulation card
        if (simElements2.card) {
            simElements2.card.style.display = state.hasSpouse ? 'block' : 'none';
        }

        // Initialize second sim state if not already done
        if (!state.isSecondSimInitialized) {
            state.stockValue2 = 0;
            state.financialAssets2 = state.financialAssets;
            state.realEstate2 = state.realEstate;
            state.deemedAssets2 = state.deemedAssets;
            state.debt2 = state.debt;
            state.isSecondSimInitialized = true;
        }

        // Update state from simulation controls
        state.stockGrowthRate = parseFloat(simElements.stockRate.value) || 0;
        state.financialGrowthRate = parseFloat(simElements.financialRate.value) || 0;
        state.realEstateGrowthRate = parseFloat(simElements.realEstateRate.value) || 0;
        state.yearsPassed = getNumberValue(simElements2.yearsPassed);

        renderCalculator();
        runSimulations();
    };
    
    // --- Event Listeners ---
    // Main Calculator Listeners
    elements.childrenDecrement.addEventListener('click', () => {
        const val = getNumberValue(elements.numChildren);
        if (val > 0) {
            elements.numChildren.value = (val - 1).toString();
            updateAndRenderAll();
        }
    });
    elements.childrenIncrement.addEventListener('click', () => {
        elements.numChildren.value = (getNumberValue(elements.numChildren) + 1).toString();
        updateAndRenderAll();
    });

    Object.values(elements).forEach(element => {
        if (element && typeof element.addEventListener === 'function' && element.tagName === 'INPUT') {
            element.addEventListener('input', updateAndRenderAll);
            
            if ((element as HTMLInputElement).type === 'number') {
                element.addEventListener('focus', (event) => {
                    (event.target as HTMLInputElement).select();
                });
            }
        }
    });
    
    // PDF Button Listener
    elements.savePdfBtn.addEventListener('click', async () => {
        const fileName = await askForFileName();
        if (fileName) {
            await generateAndSavePdf(fileName);
        }
    });

    // Simulation Listeners
    const createRateAdjuster = (rateKey: 'stockGrowthRate' | 'financialGrowthRate' | 'realEstateGrowthRate', inputEl: HTMLInputElement) => (amount: number) => {
        let currentValue = parseFloat(inputEl.value) || 0;
        currentValue = Math.max(-100, currentValue + amount); // Allow negative rates
        state[rateKey] = currentValue;
        inputEl.value = `${currentValue.toFixed(1)}%`;
        updateAndRenderAll();
    };

    const adjustStockRate = createRateAdjuster('stockGrowthRate', simElements.stockRate);
    const adjustFinancialRate = createRateAdjuster('financialGrowthRate', simElements.financialRate);
    const adjustRealEstateRate = createRateAdjuster('realEstateGrowthRate', simElements.realEstateRate);
    
    simElements.stockRateDecrement.addEventListener('click', () => adjustStockRate(-0.1));
    simElements.stockRateIncrement.addEventListener('click', () => adjustStockRate(0.1));
    simElements.financialRateDecrement.addEventListener('click', () => adjustFinancialRate(-0.1));
    simElements.financialRateIncrement.addEventListener('click', () => adjustFinancialRate(0.1));
    simElements.realEstateRateDecrement.addEventListener('click', () => adjustRealEstateRate(-0.1));
    simElements.realEstateRateIncrement.addEventListener('click', () => adjustRealEstateRate(0.1));

    // Second Simulation Table Input Listener
    if (simElements2.detailsTbody) {
        simElements2.detailsTbody.addEventListener('input', (event) => {
            const target = event.target as HTMLInputElement;
            if (target && target.classList.contains('table-input')) {
                const assetKey = target.dataset.assetKey;
                const value = parseFloat(target.value) || 0;

                if (assetKey === 'stock') state.stockValue2 = value;
                else if (assetKey === 'financial') state.financialAssets2 = value;
                else if (assetKey === 'realEstate') state.realEstate2 = value;
                else if (assetKey === 'deemedAssets') state.deemedAssets2 = value;
                else if (assetKey === 'debt') state.debt2 = value;

                debouncedRunSimulations();
            }
        });
        
        simElements2.detailsTbody.addEventListener('focusin', (event) => {
            const target = event.target as HTMLInputElement;
            if (target && target.classList.contains('table-input')) {
                target.select();
            }
        });
    }
    
    // Years Passed Listener
    if (simElements2.yearsPassed) {
        simElements2.yearsPassed.addEventListener('input', updateAndRenderAll);
        simElements2.yearsPassed.addEventListener('focus', (event) => {
            (event.target as HTMLInputElement).select();
        });
    }

    // --- Initial Calculation ---
    updateAndRenderAll();
};

// --- Start the app after checking for libraries ---
window.addEventListener('load', checkLibrariesAndInitialize);

export {};