
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
    const [activePage, setActivePage] = useState('home');
    const [heroVideo, setHeroVideo] = useState({
        url: './background-video.mp4',
        type: 'video/mp4'
    });
    const videoInputRef = useRef<HTMLInputElement>(null);

    const personalProjects = [
        {
            title: '재무목표분석툴',
            description: '재무설계의 시작은 내가 꿈꾸는 재무목표들이 시간과 투자수익률에 따라 어떻게 변하는지 인생전체를 보면서 시뮬레이션 하는 것에서 시작합니다.',
            link: 'https://yjinpapa.com/pfp'
        },
                {
            title: '상속세 계산툴',
            description: '자산 이전을 계획하는 고객을 위해 예상 상속세를 시뮬레이션하여 적정한 증여시점을 찾아 효과적인 절세 방안을 제시합니다.',
            link: 'https://yjinpapa.com/inhe'
        },
        {
            title: '은퇴설계 시뮬레이터',
            description: '은퇴설계의 로직을 이해하고, 나에게 필요하고 준비할 수 있는 은퇴자금을 계산하여 부족한 은퇴자금을 준비하는 합리적인 방법을 보여줍니다.',
            link: 'https://yjinpapa.com/retire'
        },
        {
            title: '양도소득세 계산기',
            description: '부동산 양도 시 발생하는 세금을 간단하게 알아보세요.',
            link: 'https://yjinpapa.com/realtax'
        },
        {
            title: '부동산 투자 분석',
            description: '보유기간, 양도소득세를 감안한 수익률을 편리하게 계산하세요.',
            link: 'https://yjinpapa.com/real'
        }
    ];

    const corporateProjects = [
        {
            title: '기업경영분석툴',
            description: '크레탑의 정보를 입력하면 기업분석을 통해 주식평가액, 상속세 등을 시뮬레이션 할 수 있습니다.',
            link: 'https://yjinpapa.com/cor'
        },
        {
            title: '기업자료 JSON 변환기',
            description: '크레탑의 자료를 읽어들여 JSON으로 변경하는 자료입니다. 여기에서 저장한 자료를 기업경영분석툴에서 읽어들여서 분석하세요.',
            link: 'https://yjinpapa.com/json'
        },
                {
            title: 'DCF 분석툴',
            description: 'JSON자료를 읽어들여 기업의 가치를 DCF법으로 평가하는 툴입니다. 제미나이 API가 있어야 사용할 수 있습니다.',
            link: 'https://yjinpapa.com/dcf'
        },
        {
            title: '임원적정급여 계산툴',
            description: '4대보험, 직원들 눈치가 무서워서 아직도 급여를 낮게 가져가시나요? 수익의 규모나 플랜에 따라 임원의 급여는 달려져야 합니다. 여기 있는 임원적정급여 계산툴로 직접 계산해보세요.',
            link: 'https://yjinpapa.com/esalary'
        }
    ];

    const handleVideoUploadClick = () => {
        videoInputRef.current?.click();
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const videoUrl = URL.createObjectURL(file);
            setHeroVideo({ url: videoUrl, type: file.type });
        }
    };

    return (
        <>
            <header className="header">
                <nav className="container">
                    <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setActivePage('home'); }}>jminpapa의 실전 재무설계</a>
                    <ul className="nav-links">
                        <li><a href="#" onClick={(e) => { e.preventDefault(); setActivePage('about'); }} className={activePage === 'about' ? 'active' : ''}>저는</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); setActivePage('personal-tools'); }} className={activePage === 'personal-tools' ? 'active' : ''}>개인재무설계툴</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); setActivePage('corporate-tools'); }} className={activePage === 'corporate-tools' ? 'active' : ''}>기업재무설계툴</a></li>
                    </ul>
                </nav>
            </header>

            <main>
                {activePage === 'home' && (
                    <section className="hero">
                        <video key={heroVideo.url} autoPlay loop muted playsInline className="hero-video">
                            <source src={heroVideo.url} type={heroVideo.type} />
                            Your browser does not support the video tag.
                        </video>
                        <div className="hero-overlay"></div>
                        <div className="container">
                            <h1>당신의 미래를 직접 설계하세요</h1>
                            <p className="subtitle">전문적인 분석툴과 함께 스마트한 재무목표를 직접 세워보세요.</p>
                        </div>
                         <input
                            type="file"
                            accept="video/*"
                            ref={videoInputRef}
                            onChange={handleVideoFileChange}
                            style={{ display: 'none' }}
                            aria-label="배경 영상 파일 선택"
                        />
                        <button className="video-upload-button" onClick={handleVideoUploadClick}>
                            배경 영상 변경
                        </button>
                    </section>
                )}

                {activePage === 'about' && (
                    <section id="about" className="about-section">
                        <div className="container">
                            <h2>저는</h2>
                            <p>
                                2007년 3월부터 개인재무설계 상담을 유료로 해왔습니다. 처음에는 10만원에 1년간 상담을 하기도 했지만 지금은 최소 500만원에서 자산의 0.2%를 상담료로 받고 재무설계 상담을 하고 있습니다.
                            </p>
                            <p>
                                여기에 있는 툴들은 제가 근 20년간 상담에 사용하던 엑셀을 많은 분들이 자유롭게 사용할 수 있도록 웹프로그램으로 만들고 있는 것을 하나둘 모으고 있는 것입니다.
                            </p>
                            <p>
                                요즘 보니 재무설계에 대한 좋지 않은 이야기도 많이 있던데 그러한 문제는 보험판매을 위한 재무설계를 하기때문이라고 생각합니다.
                            </p>
                            <p>
                                제가 말하는 실전재무설계는 보험은 물론 투자, 세금, 부동산, 증여, 은퇴, 상속을 바탕으로 병의원과 법인기업의 기본적인 노무, 회계에 대한 지식을 습득하여 이를 고객의 이익을 위해 종합적으로 판단하는 것을 말합니다.
                            </p>
                            <p>
                                고객에게 발생하는 다양한 분야의 문제를 종합적으로 판단하는 것은 CFP교재의 이론만 배워서 가능한 일이 아닙니다. 대부분의 CFP가 자격증은 있는데 실무능력이 없어 보험으로 소득을 만들려고 하니 위와 같은 보험판매를 위한 재무설계가 될 수 밖에 없는 것입니다.
                            </p>
                            <p>
                                실제 현장에서 재무설계 업무를 깊이를 가지고 10년은 해야 가능한 일인데 그 기간을 우리나라에서 견디는 것은 엄청나게 힘든 일입니다. 저또한 처음 재무설계를 시작하면서 10년간은 소득의 압박에 엄청 힘들었던 기억이 있습니다. 흔히 하는 말로 "누가 돈주고 상담을 받냐?"입니다. 참 많이 듣던 말입니다. 그 고통을 알기에 누구에게도 재무설계가 좋다는 말을 쉽게 하지 못합니다. 가장으로써 생활비를 가져다 주지 못하는 것이 얼마나 고통스러운지 다들 잘 아실겁니다.
                            </p>
                            <p>
                                저는 운이 좋았던게 이론을 공부하면 신기하게도 실무에 적용할 수 있는 케이스가 잘 생겼습니다. 물론 돈을 많이 버는 운은 없었지만 다양한 경험을 할 수 있는 사례가 많이 생겨서 정말 재밌게 재무설계 상담을 해왔습니다.
                            </p>
                            <p>
                                이곳에 있는 툴들을 여러분들이 많이 사용하시면서 제가 느끼는 것을 함께 공유할 수 있으면 좋겠습니다.
                            </p>
                            <p className="signature">
                                모두 항상 건강하시고 행복하세요.<br />
                                jminpapa 드림
                            </p>
                        </div>
                    </section>
                )}

                {activePage === 'personal-tools' && (
                    <section id="personal-tools" className="projects-section">
                        <div className="container">
                            <h2>개인재무설계툴</h2>
                            <div className="project-grid">
                                {personalProjects.map((project, index) => (
                                    <a
                                        href={project.link}
                                        className="project-card"
                                        key={index}
                                    >
                                        <h3>{project.title}</h3>
                                        <p>{project.description}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {activePage === 'corporate-tools' && (
                    <section id="corporate-tools" className="projects-section">
                        <div className="container">
                            <h2>기업재무설계툴</h2>
                            <div className="project-grid">
                                {corporateProjects.map((project, index) => (
                                    <a href={project.link} className="project-card" key={index}>
                                        <h3>{project.title}</h3>
                                        <p>{project.description}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

            </main>

            <footer className="footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} jminpapa의 실전 재무설계. All Rights Reserved.</p>
                </div>
            </footer>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
