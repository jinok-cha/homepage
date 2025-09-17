import { GoogleGenAI } from "@google/genai";

const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
const reportTextarea = document.getElementById('report-text') as HTMLTextAreaElement;
const jsonTemplateTextarea = document.getElementById('json-template') as HTMLTextAreaElement;
const convertButton = document.getElementById('convert-button') as HTMLButtonElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const jsonOutputCode = document.getElementById('json-output') as HTMLElement;
const buttonText = convertButton.querySelector('.button-text') as HTMLSpanElement;
const spinner = convertButton.querySelector('.spinner') as HTMLDivElement;
const toggleLockButton = document.getElementById('toggle-lock-button') as HTMLButtonElement;
const lockIcon = document.getElementById('lock-icon') as HTMLElement;
const unlockIcon = document.getElementById('unlock-icon') as HTMLElement;

let generatedJsonString: string | null = null;
let isTemplateLocked = false;

// On page load, try to load the API key from localStorage
const savedApiKey = localStorage.getItem('geminiApiKey');
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

// When the user types in the API key input, save it to localStorage
apiKeyInput.addEventListener('input', () => {
  localStorage.setItem('geminiApiKey', apiKeyInput.value);
});


// Set a default template to guide the user for financial statements
jsonTemplateTextarea.value = JSON.stringify(
  {
  "balanceSheet": [
    {
      "2022": 2844415,
      "2023": 3854055,
      "2024": 4521548,
      "계정과목": "자산",
      "isHeader": true
    },
    {
      "2022": 2371047,
      "2023": 2916743,
      "2024": 3777257,
      "계정과목": "  유동자산",
      "isHeader": true
    },
    {
      "2022": 2371047,
      "2023": 2916743,
      "2024": 3777257,
      "계정과목": "    당좌자산",
      "isHeader": true
    },
    {
      "2022": 1221538,
      "2023": 1490985,
      "2024": 2606043,
      "계정과목": "      현금및현금성자산"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      단기예금"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      단기매매증권"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      단기대여금"
    },
    {
      "2022": 852197,
      "2023": 1035596,
      "2024": 777164,
      "계정과목": "      매출채권"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      미수금"
    },
    {
      "2022": 305300,
      "2023": 400000,
      "2024": 400330,
      "계정과목": "      선급금"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      가지급금"
    },
    {
      "2022": 534,
      "2023": 518,
      "2024": 1492,
      "계정과목": "      기타유동자산"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "    재고자산",
      "isHeader": true
    },
    {
      "2022": 473368,
      "2023": 937312,
      "2024": 744291,
      "계정과목": "  비유동자산",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "    투자자산",
      "isHeader": true
    },
    {
      "2022": 460480,
      "2023": 603785,
      "2024": 410764,
      "계정과목": "    유형자산",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      토지"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      건설중인자산"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "      건물및부속설비"
    },
    {
      "2022": 186771,
      "2023": 110176,
      "2024": 63567,
      "계정과목": "      기계장치"
    },
    {
      "2022": 252654,
      "2023": 473550,
      "2024": 267935,
      "계정과목": "      시설장치"
    },
    {
      "2022": 4,
      "2023": 1,
      "2024": 68296,
      "계정과목": "      차량운반구"
    },
    {
      "2022": 1670,
      "2023": 663,
      "2024": 364,
      "계정과목": "      공구,기구,비품"
    },
    {
      "2022": 19381,
      "2023": 19395,
      "2024": 10602,
      "계정과목": "      기타유형자산"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "    무형자산",
      "isHeader": true
    },
    {
      "2022": 12888,
      "2023": 333527,
      "2024": 333527,
      "계정과목": "    기타비유동자산",
      "isHeader": true
    },
    {
      "2022": 1438222,
      "2023": 1319105,
      "2024": 1125309,
      "계정과목": "부채",
      "isHeader": true
    },
    {
      "2022": 589245,
      "2023": 572890,
      "2024": 613704,
      "계정과목": "  유동부채",
      "isHeader": true
    },
    {
      "2022": 462472,
      "2023": 435306,
      "2024": 440293,
      "계정과목": "    매입채무"
    },
    {
      "2022": 11801,
      "2023": 12340,
      "2024": 10478,
      "계정과목": "    미지급금"
    },
    {
      "2022": 15000,
      "2023": 0,
      "2024": 0,
      "계정과목": "    선수금"
    },
    {
      "2022": 45873,
      "2023": 71930,
      "2024": 65195,
      "계정과목": "    예수금"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "    가수금"
    },
    {
      "2022": 14036,
      "2023": 5593,
      "2024": 594,
      "계정과목": "    단기차입금"
    },
    {
      "2022": 40063,
      "2023": 47721,
      "2024": 97144,
      "계정과목": "    기타유동부채"
    },
    {
      "2022": 848977,
      "2023": 746215,
      "2024": 511605,
      "계정과목": "  비유동부채",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "    사채"
    },
    {
      "2022": 710425,
      "2023": 544714,
      "2024": 299200,
      "계정과목": "    장기차입금"
    },
    {
      "2022": 138552,
      "2023": 201501,
      "2024": 212405,
      "계정과목": "    기타비유동부채"
    },
    {
      "2022": 1406193,
      "2023": 2534950,
      "2024": 3396239,
      "계정과목": "자본",
      "isHeader": true
    },
    {
      "2022": 50000,
      "2023": 50000,
      "2024": 50000,
      "계정과목": "  자본금",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  자본잉여금",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기타포괄손익누계액",
      "isHeader": true
    },
    {
      "2022": 1356193,
      "2023": 2484950,
      "2024": 3346239,
      "계정과목": "  이익잉여금",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기타자본",
      "isHeader": true
    }
  ],
  "cashFlowStatement": [],
  "companyProfile": {
    "기업명": "(주)지니스",
    "사업자번호": "000-86-00000",
    "대표자명": "000",
    "설립년월": "2014-01-13",
    "기업규모": "소기업",
    "주소": "부산광역시 해운대구 000",
    "신용등급": "",
    "주요제품": "경영컨설팅, 재무설계"
  },
  "executives": [
    {
      "name": "000",
      "title": "대표이사",
      "tenure": "10년 8개월",
      "relationship": "본인"
    },
    {
      "name": "김이사",
      "title": "사내이사",
      "tenure": "0",
      "relationship": "타인"
    }
  ],
  "financialDiagnosis": {},
  "financialDiagnosisDetails": {},
  "financialRatios": [
    {
      "year": "2022",
      "영업이익률": 3.48,
      "ROE": 14.12,
      "ROIC": 20,
      "부채비율": 102.28,
      "차입금의존도": 25.47
    },
    {
      "year": "2023",
      "영업이익률": 16.11,
      "ROE": 59.21,
      "ROIC": 114.43,
      "부채비율": 52.04,
      "차입금의존도": 14.28
    },
    {
      "year": "2024",
      "영업이익률": 16.57,
      "ROE": 33.84,
      "ROIC": 109.65,
      "부채비율": 33.13,
      "차입금의존도": 6.63
    }
  ],
  "incomeStatement": [
    {
      "2022": 5066919,
      "2023": 7260687,
      "2024": 7055567,
      "계정과목": "매출액",
      "isHeader": true
    },
    {
      "2022": 4325576,
      "2023": 5404688,
      "2024": 5190771,
      "계정과목": "매출원가",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기초재고"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  매입"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기말재고"
    },
    {
      "2022": 741343,
      "2023": 1855999,
      "2024": 1864796,
      "계정과목": "매출총이익",
      "isHeader": true
    },
    {
      "2022": 564837,
      "2023": 686247,
      "2024": 695958,
      "계정과목": "판매비와관리비",
      "isHeader": true
    },
    {
      "2022": 326179,
      "2023": 398013,
      "2024": 346836,
      "계정과목": "  급여"
    },
    {
      "2022": 57241,
      "2023": 65423,
      "2024": 39358,
      "계정과목": "  퇴직급여"
    },
    {
      "2022": 12434,
      "2023": 21370,
      "2024": 36381,
      "계정과목": "  복리후생비"
    },
    {
      "2022": 33527,
      "2023": 41975,
      "2024": 49113,
      "계정과목": "  접대비"
    },
    {
      "2022": 1275,
      "2023": 2281,
      "2024": 1650,
      "계정과목": "  여비교통비"
    },
    {
      "2022": 1462,
      "2023": 1582,
      "2024": 1525,
      "계정과목": "  통신비"
    },
    {
      "2022": 22164,
      "2023": 26013,
      "2024": 28252,
      "계정과목": "  소모품비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  수도광열비"
    },
    {
      "2022": 17475,
      "2023": 27708,
      "2024": 20976,
      "계정과목": "  세금과공과"
    },
    {
      "2022": 27159,
      "2023": 25534,
      "2024": 24814,
      "계정과목": "  임차료"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  수선비"
    },
    {
      "2022": 4073,
      "2023": 3194,
      "2024": 1897,
      "계정과목": "  차량유지비"
    },
    {
      "2022": 24875,
      "2023": 21282,
      "2024": 36908,
      "계정과목": "  보험료"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  사무비"
    },
    {
      "2022": 18163,
      "2023": 31033,
      "2024": 30124,
      "계정과목": "  지급수수료"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기타관리비"
    },
    {
      "2022": 274,
      "2023": 1744,
      "2024": 0,
      "계정과목": "  광고선전비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  도서인쇄비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  포장비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  운반비"
    },
    {
      "2022": 8522,
      "2023": 10356,
      "2024": 0,
      "계정과목": "  대손상각비"
    },
    {
      "2022": 10014,
      "2023": 8739,
      "2024": 75423,
      "계정과목": "  감가상각비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  무형자산상각비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  교육훈련비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  경상개발비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 2701,
      "계정과목": "  기타"
    },
    {
      "2022": 176506,
      "2023": 1169752,
      "2024": 1168838,
      "계정과목": "영업이익",
      "isHeader": true
    },
    {
      "2022": 53797,
      "2023": 27284,
      "2024": 6590,
      "계정과목": "  영업외수익",
      "isHeader": true
    },
    {
      "2022": 1527,
      "2023": 1885,
      "2024": 2235,
      "계정과목": "    이자수익"
    },
    {
      "2022": 39999,
      "2023": 14999,
      "2024": 0,
      "계정과목": "    유형,리스자산처분이익"
    },
    {
      "2022": 6001,
      "2023": 1878,
      "2024": 1771,
      "계정과목": "    기타영업외이익"
    },
    {
      "2022": 15589,
      "2023": 25111,
      "2024": 69048,
      "계정과목": "  영업외비용",
      "isHeader": true
    },
    {
      "2022": 15526,
      "2023": 25111,
      "2024": 15303,
      "계정과목": "    이자비용"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "    유형,리스자산처분손실"
    },
    {
      "2022": 63,
      "2023": 0,
      "2024": 53745,
      "계정과목": "    기타영업외비용"
    },
    {
      "2022": 214714,
      "2023": 1171925,
      "2024": 1106380,
      "계정과목": "법인세비용차감전순손익",
      "isHeader": true
    },
    {
      "2022": 26729,
      "2023": 5168,
      "2024": 102929,
      "계정과목": "법인세비용"
    },
    {
      "2022": 187985,
      "2023": 1166757,
      "2024": 1003451,
      "계정과목": "당기순이익",
      "isHeader": true
    },
    {
      "2022": 38000,
      "2023": 38000,
      "2024": 38000,
      "계정과목": "배당금"
    }
  ],
  "industryComparisonData": [
    {
      "metric": "총자산",
      "company": 3854,
      "average": 2245,
      "top25": 3280
    },
    {
      "metric": "자본총계",
      "company": 2535,
      "average": 1104,
      "top25": 1802
    },
    {
      "metric": "매출액",
      "company": 7261,
      "average": 2323,
      "top25": 3542
    },
    {
      "metric": "영업이익",
      "company": 1170,
      "average": 119,
      "top25": 231
    },
    {
      "metric": "당기순이익",
      "company": 1167,
      "average": 100,
      "top25": 198
    }
  ],
  "relatedCompanies": [
    {
      "기업명": "",
      "사업내용": "",
      "관계내용": "",
      "지분율": 0,
      "결산년도": 2024,
      "자본금": 100,
      "자산총계": 10057,
      "매출액": 3107,
      "순이익": 97
    }
  ],
  "shareholders": [
    {
      "name": "000",
      "stake": 80,
      "relationship": "최대주주",
      "shares": 8000
    },
    {
      "name": "000",
      "stake": 20,
      "relationship": "타인",
      "shares": 2000
    }
  ],
  "statementOfCostOfGoodsManufactured": [
    {
      "2022": 1941064,
      "2023": 2257483,
      "2024": 2682441,
      "계정과목": "원재료비",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기초원재료재고"
    },
    {
      "2022": 1941064,
      "2023": 2257483,
      "2024": 2682441,
      "계정과목": "  당기매입액"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  기말원재료재고"
    },
    {
      "2022": 215547,
      "2023": 237505,
      "2024": 281957,
      "계정과목": "노동관계비용",
      "isHeader": true
    },
    {
      "2022": 215547,
      "2023": 237505,
      "2024": 281957,
      "계정과목": "  급여"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  퇴직급여"
    },
    {
      "2022": 2168965,
      "2023": 2909700,
      "2024": 2226373,
      "계정과목": "경비",
      "isHeader": true
    },
    {
      "2022": 19063,
      "2023": 33370,
      "2024": 33948,
      "계정과목": "  복리후생비"
    },
    {
      "2022": 346635,
      "2023": 276389,
      "2024": 215420,
      "계정과목": "  감가상각비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  세금과공과비"
    },
    {
      "2022": 35542,
      "2023": 32030,
      "2024": 32451,
      "계정과목": "  소모품비"
    },
    {
      "2022": 35392,
      "2023": 45848,
      "2024": 156225,
      "계정과목": "  지급수수료"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  접대비"
    },
    {
      "2022": 13240,
      "2023": 17949,
      "2024": 12276,
      "계정과목": "  보험료"
    },
    {
      "2022": 0,
      "2023": 5920,
      "2024": 4799,
      "계정과목": "  수선비"
    },
    {
      "2022": 42431,
      "2023": 53224,
      "2024": 50790,
      "계정과목": "  전력비"
    },
    {
      "2022": 1391362,
      "2023": 2108775,
      "2024": 1431059,
      "계정과목": "  운반비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  도서인쇄비"
    },
    {
      "2022": 765,
      "2023": 148,
      "2024": 144,
      "계정과목": "  여비교통비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  무형자산상각비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  포장비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  경상개발비"
    },
    {
      "2022": 31409,
      "2023": 33982,
      "2024": 34146,
      "계정과목": "  차량유지비"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "  외주가공비"
    },
    {
      "2022": 253126,
      "2023": 301865,
      "2024": 254995,
      "계정과목": "  기타"
    },
    {
      "2022": 4325576,
      "2023": 5404688,
      "2024": 5190771,
      "계정과목": "당기총제조비용",
      "isHeader": true
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "기초재공품재고액"
    },
    {
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "계정과목": "기말재공품재고액"
    },
    {
      "2022": 4325576,
      "2023": 5404688,
      "2024": 5190771,
      "계정과목": "당기제품제조원가",
      "isHeader": true
    }
  ],
  "summaryBalanceSheet": [
    {
      "year": "2022",
      "자산총계": 2844,
      "부채총계": 1438,
      "자본총계": 1406
    },
    {
      "year": "2023",
      "자산총계": 3854,
      "부채총계": 1319,
      "자본총계": 2535
    },
    {
      "year": "2024",
      "자산총계": 4522,
      "부채총계": 1125,
      "자본총계": 3396
    }
  ],
  "summaryCashFlow": [
    {
      "year": "2022",
      "현금영업이익": 106,
      "경상활동후의현금흐름": 41,
      "투자활동후의현금흐름": -230
    },
    {
      "year": "2023",
      "현금영업이익": 1210,
      "경상활동후의현금흐름": 1215,
      "투자활동후의현금흐름": 482
    },
    {
      "year": "2024",
      "현금영업이익": 1749,
      "경상활동후의현금흐름": 1607,
      "투자활동후의현금흐름": 1508
    }
  ],
  "summaryIncomeStatement": [
    {
      "year": "2022",
      "매출액": 5067,
      "영업이익": 177,
      "당기순이익": 188
    },
    {
      "year": "2023",
      "매출액": 7261,
      "영업이익": 1170,
      "당기순이익": 1167
    },
    {
      "year": "2024",
      "매출액": 7056,
      "영업이익": 1169,
      "당기순이익": 1003
    }
  ]
},
  null,
  2
);

async function convertTextToJson() {
  const apiKey = apiKeyInput.value;
  const sourceText = reportTextarea.value;
  const templateJson = jsonTemplateTextarea.value;

  saveButton.disabled = true;
  generatedJsonString = null;

  if (!apiKey.trim()) {
    jsonOutputCode.textContent = '오류: Gemini API 키를 입력해주세요.';
    return;
  }
  if (!sourceText.trim()) {
    jsonOutputCode.textContent = '오류: 원본 텍스트를 입력해주세요.';
    return;
  }
  if (!templateJson.trim()) {
    jsonOutputCode.textContent = '오류: JSON 형식을 입력해주세요.';
    return;
  }

  try {
    JSON.parse(templateJson);
  } catch (e) {
    jsonOutputCode.textContent = '오류: JSON 형식이 올바르지 않습니다. 확인해주세요.';
    return;
  }

  setLoading(true);
  jsonOutputCode.textContent = 'Gemini API를 호출 중입니다. 잠시만 기다려주세요...';

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `제공된 원본 텍스트에서 정보를 추출하여, 주어진 JSON 형식 템플릿에 맞춰 채워주세요.
템플릿의 구조와 키를 그대로 사용하고, 텍스트에 있는 내용으로 값을 채워야 합니다.
텍스트에 없는 정보는 빈 값으로 남겨두세요. 최종 결과는 JSON 객체여야 합니다.

[매우 중요한 규칙]
1.  **연도 키 변환**: "YYYY-1", "YYYY-2", "YYYY-3" 와 같이 연도를 나타내는 자리 표시자 키는 원본 텍스트의 "요약 재무상태표" 아래 표 헤더에서 찾은 실제 연도(예: "2012", "2013", "2014")로 반드시 교체해야 합니다.
2.  **항목 이름 정규화**: '자산(*)'과 같이 항목 이름에 포함된 괄호나 별표(*) 등의 특수 문자는 무시하고 '자산', '부채'와 같은 핵심 키워드만 사용하여 데이터를 찾으세요.
3.  **숫자 변환 규칙 (가장 중요)**:
    - 표에 있는 모든 숫자 값에서 쉼표(,)를 제거하고, 그 숫자 그대로 JSON에 값으로 사용하세요. (예: "7,128,686" -> 7128686).
    - **단위를 변환하거나 숫자를 나누는 등의 추가 계산을 하지 마세요.** 원본 텍스트에 명시된 단위(예: 천원)의 숫자 값을 그대로 가져옵니다.
    - **최종 JSON에 들어가는 모든 재무 데이터 값은 반드시 따옴표가 없는 숫자(Number) 타입이어야 합니다.**

--- 원본 텍스트 시작 ---
${sourceText}
--- 원본 텍스트 끝 ---

--- JSON 형식 템플릿 시작 ---
${templateJson}
--- JSON 형식 템플릿 끝 ---`,
    });

    // The model is instructed to return JSON, but it might have markdown characters.
    // Clean it up before parsing.
    const rawJsonString = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedJson = JSON.parse(rawJsonString);
    generatedJsonString = JSON.stringify(parsedJson, null, 2);
    jsonOutputCode.textContent = generatedJsonString;
    saveButton.disabled = false;

  } catch (error) {
    console.error(error);
    jsonOutputCode.textContent = `오류가 발생했습니다: ${(error as Error).message || '알 수 없는 오류'}`;
  } finally {
    setLoading(false);
  }
}

/**
 * Recursively searches an object for the first string value associated with a list of preferred keys.
 * This makes the filename detection more robust.
 * @param obj The object to search.
 * @param keysToFind An array of keys to look for (case-insensitive).
 * @returns The found string value, or null if not found.
 */
function findCompanyName(obj: any, keysToFind: string[]): string | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  // Handle array by searching in the first element.
  if (Array.isArray(obj)) {
    return findCompanyName(obj[0], keysToFind);
  }

  // First, check for direct key matches at the current level.
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      if (keysToFind.includes(lowerKey) && typeof obj[key] === 'string' && obj[key].trim()) {
        return obj[key];
      }
    }
  }

  // If no direct match is found, recurse into nested objects.
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object') {
        const nestedResult = findCompanyName(obj[key], keysToFind);
        if (nestedResult) {
          return nestedResult;
        }
      }
    }
  }

  return null;
}


function handleSave() {
  if (!generatedJsonString) return;

  let filename = 'data';
  try {
    const data = JSON.parse(generatedJsonString);
    // Broader and more i18n-friendly list of keys to search for the company name.
    const potentialKeys = ['기업명', 'companyname', 'company_name', 'company', 'customer_name', 'customer', 'name', 'recipename'];
    
    const companyName = findCompanyName(data, potentialKeys);

    if (companyName) {
      // Sanitize filename to prevent issues and limit length.
      filename = companyName.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50).trim() || 'data';
    }
  } catch (e) {
    console.error("Could not determine filename from JSON, using default.", e);
  }

  const blob = new Blob([generatedJsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setLoading(isLoading: boolean) {
  convertButton.disabled = isLoading;
  spinner.hidden = !isLoading;
  buttonText.textContent = isLoading ? '' : '변환';
  if (isLoading) {
    saveButton.disabled = true;
  }
}

function toggleTemplateLock() {
  isTemplateLocked = !isTemplateLocked;
  jsonTemplateTextarea.readOnly = isTemplateLocked;

  if (isTemplateLocked) {
    lockIcon.style.display = 'block';
    unlockIcon.style.display = 'none';
    toggleLockButton.title = '템플릿 잠금 해제';
  } else {
    lockIcon.style.display = 'none';
    unlockIcon.style.display = 'block';
    toggleLockButton.title = '템플릿 잠금';
  }
}

convertButton.addEventListener('click', convertTextToJson);
saveButton.addEventListener('click', handleSave);
toggleLockButton.addEventListener('click', toggleTemplateLock);
