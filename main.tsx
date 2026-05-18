import React from "react";
import ReactDOM from "react-dom/client";
import { ArrowRight, Check, Home, RotateCcw, Trophy, X } from "lucide-react";
import "./styles.css";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const roundsPerLevel = 10;
const maxLevel = 4;

type FieldState = "empty" | "right" | "wrong";
type RoundResult = "right" | "wrong" | null;

type Round = {
  letter: string;
  answers: string[];
};

type Totals = {
  right: number;
  wrong: number;
};

const levelHelp: Record<number, string> = {
  1: "Welcher Buchstabe steht davor?",
  2: "Welcher Buchstabe steht davor und danach?",
  3: "Ein Buchstabe davor. Zwei danach.",
  4: "Zwei Buchstaben davor. Zwei danach."
};

function getRangeForLevel(level: number) {
  if (level === 1) return { min: 1, max: alphabet.length - 1 };
  if (level === 2) return { min: 1, max: alphabet.length - 2 };
  if (level === 3) return { min: 1, max: alphabet.length - 3 };
  return { min: 2, max: alphabet.length - 3 };
}

function getAnswers(level: number, index: number) {
  if (level === 1) return [alphabet[index - 1]];
  if (level === 2) return [alphabet[index - 1], alphabet[index + 1]];
  if (level === 3) return [alphabet[index - 1], alphabet[index + 1], alphabet[index + 2]];
  return [alphabet[index - 2], alphabet[index - 1], alphabet[index + 1], alphabet[index + 2]];
}

function makeRound(level: number, lastLetter?: string): Round {
  const { min, max } = getRangeForLevel(level);
  const choices = alphabet.slice(min, max + 1).filter((letter) => letter !== lastLetter);
  const letter = choices[Math.floor(Math.random() * choices.length)];
  const index = alphabet.indexOf(letter);
  return { letter, answers: getAnswers(level, index) };
}

function clampToLetter(value: string) {
  const match = value.toUpperCase().match(/[A-Z]/);
  return match ? match[0] : "";
}

function App() {
  const firstRound = React.useMemo(() => makeRound(1), []);
  const [level, setLevel] = React.useState(1);
  const [roundNumber, setRoundNumber] = React.useState(1);
  const [round, setRound] = React.useState(firstRound);
  const [entries, setEntries] = React.useState<string[]>(() => Array(firstRound.answers.length).fill(""));
  const [fieldStates, setFieldStates] = React.useState<FieldState[]>(["empty"]);
  const [result, setResult] = React.useState<RoundResult>(null);
  const [levelDone, setLevelDone] = React.useState(false);
  const [appDone, setAppDone] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [levelTotals, setLevelTotals] = React.useState<Totals>({ right: 0, wrong: 0 });
  const [allTotals, setAllTotals] = React.useState<Totals>({ right: 0, wrong: 0 });
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  React.useEffect(() => {
    if (!levelDone && !appDone && result === null) {
      window.setTimeout(() => inputRefs.current[0]?.focus(), 40);
    }
  }, [round, levelDone, appDone, result]);

  const startRound = (nextLevel: number, nextRoundNumber: number, lastLetter?: string) => {
    const nextRound = makeRound(nextLevel, lastLetter);
    setLevel(nextLevel);
    setRoundNumber(nextRoundNumber);
    setRound(nextRound);
    setEntries(Array(nextRound.answers.length).fill(""));
    setFieldStates(Array(nextRound.answers.length).fill("empty"));
    setResult(null);
    setLevelDone(false);
    setAppDone(false);
    setEnded(false);
  };

  const checkAnswers = (nextEntries: string[]) => {
    const states = nextEntries.map((entry, index) => (entry === round.answers[index] ? "right" : "wrong"));
    const isRight = states.every((state) => state === "right");
    const rightCount = states.filter((state) => state === "right").length;
    const wrongCount = states.length - rightCount;
    setFieldStates(states);
    setResult(isRight ? "right" : "wrong");
    setLevelTotals((current) => ({
      right: current.right + rightCount,
      wrong: current.wrong + wrongCount
    }));
    setAllTotals((current) => ({
      right: current.right + rightCount,
      wrong: current.wrong + wrongCount
    }));
  };

  const handleInput = (index: number, value: string) => {
    if (result !== null) return;
    const letter = clampToLetter(value);
    const nextEntries = [...entries];
    nextEntries[index] = letter;
    setEntries(nextEntries);

    if (letter && index < round.answers.length - 1) {
      window.setTimeout(() => inputRefs.current[index + 1]?.focus(), 20);
    }

    if (nextEntries.every(Boolean)) {
      checkAnswers(nextEntries);
    }
  };

  const goNext = () => {
    if (roundNumber >= roundsPerLevel) {
      if (level === maxLevel) {
        setAppDone(true);
      } else {
        setLevelDone(true);
      }
      return;
    }
    startRound(level, roundNumber + 1, round.letter);
  };

  const repeatLevel = () => {
    setLevelTotals({ right: 0, wrong: 0 });
    if (level === 1) {
      setAllTotals({ right: 0, wrong: 0 });
    }
    startRound(level, 1);
  };

  const nextLevel = () => {
    const target = Math.min(level + 1, maxLevel);
    setLevelTotals({ right: 0, wrong: 0 });
    startRound(target, 1);
  };

  const endApp = () => {
    setAppDone(true);
    setLevelDone(false);
  };

  const showGoodbye = () => {
    setEnded(true);
  };

  const restartAll = () => {
    setLevelTotals({ right: 0, wrong: 0 });
    setAllTotals({ right: 0, wrong: 0 });
    startRound(1, 1);
  };

  const totalAnswers = allTotals.right + allTotals.wrong;
  const percentRight = totalAnswers > 0 ? Math.round((allTotals.right / totalAnswers) * 100) : 0;
  const showWin = appDone && percentRight > 80;

  return (
    <main className="app">
      {showWin && <Confetti />}
      <section className="quiz-shell" aria-live="polite">
        <header className="topbar">
          <div>
            <p className="eyebrow">Alphabet-Quiz</p>
            <h1>Buchstaben üben</h1>
          </div>
          <div className="level-badge">Level {level}</div>
        </header>

        {!levelDone && !appDone && !ended && (
          <>
            <StatusBar level={level} roundNumber={roundNumber} levelTotals={levelTotals} />
            <p className="prompt">{levelHelp[level]}</p>
            <AlphabetTask
              round={round}
              entries={entries}
              fieldStates={fieldStates}
              result={result}
              inputRefs={inputRefs}
              onInput={handleInput}
            />
            <Feedback result={result} answers={round.answers} />
            {result !== null && (
              <button className="primary-button" onClick={goNext}>
                <ArrowRight aria-hidden="true" />
                Weiter
              </button>
            )}
          </>
        )}

        {levelDone && !appDone && !ended && (
          <ChoiceScreen
            title={`Level ${level} ist fertig.`}
            text="Was möchtest du jetzt tun?"
            nextLabel={`Level ${level + 1}`}
            onNext={nextLevel}
            onRepeat={repeatLevel}
            onEnd={endApp}
          />
        )}

        {appDone && !ended && (
          <EndScreen
            totals={allTotals}
            percentRight={percentRight}
            showWin={showWin}
            onRepeat={level === maxLevel ? repeatLevel : restartAll}
            onEnd={showGoodbye}
          />
        )}

        {ended && <GoodbyeScreen onRestart={restartAll} />}
      </section>
    </main>
  );
}

function StatusBar({
  level,
  roundNumber,
  levelTotals
}: {
  level: number;
  roundNumber: number;
  levelTotals: Totals;
}) {
  return (
    <div className="status-grid">
      <StatusItem label="Level" value={level.toString()} />
      <StatusItem label="Runde" value={`${roundNumber} von ${roundsPerLevel}`} />
      <StatusItem label="Richtig" value={levelTotals.right.toString()} tone="right" />
      <StatusItem label="Falsch" value={levelTotals.wrong.toString()} tone="wrong" />
    </div>
  );
}

function StatusItem({ label, value, tone }: { label: string; value: string; tone?: "right" | "wrong" }) {
  return (
    <div className={`status-item ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AlphabetTask({
  round,
  entries,
  fieldStates,
  result,
  inputRefs,
  onInput
}: {
  round: Round;
  entries: string[];
  fieldStates: FieldState[];
  result: RoundResult;
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onInput: (index: number, value: string) => void;
}) {
  const centerIndex = round.answers.length === 1 ? 0 : round.answers.length === 4 ? 2 : 1;
  const slots = [...entries];
  slots.splice(centerIndex, 0, round.letter);
  let inputIndex = -1;

  return (
    <div className="task" aria-label="Aufgabe">
      {slots.map((slot, slotIndex) => {
        const isLetter = slotIndex === centerIndex;
        if (isLetter) {
          return (
            <div className="given-letter" key={`${round.letter}-${slotIndex}`}>
              {round.letter}
            </div>
          );
        }
        inputIndex += 1;
        const currentInput = inputIndex;
        return (
          <input
            aria-label={`Eingabe ${currentInput + 1}`}
            className={`letter-input ${fieldStates[currentInput]}`}
            inputMode="text"
            key={`input-${currentInput}`}
            maxLength={1}
            pattern="[A-Za-z]"
            ref={(node) => {
              inputRefs.current[currentInput] = node;
            }}
            type="text"
            value={entries[currentInput]}
            disabled={result !== null}
            onChange={(event) => onInput(currentInput, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !entries[currentInput] && currentInput > 0) {
                inputRefs.current[currentInput - 1]?.focus();
              }
            }}
          />
        );
      })}
    </div>
  );
}

function Feedback({ result, answers }: { result: RoundResult; answers: string[] }) {
  if (result === null) return <p className="feedback neutral">Bitte einen Buchstaben eingeben.</p>;
  if (result === "right") {
    return (
      <div className="feedback right">
        <Check aria-hidden="true" />
        <span>Richtig!</span>
      </div>
    );
  }
  return (
    <div className="feedback wrong">
      <X aria-hidden="true" />
      <span>Falsch. Richtig ist: {answers.join(" ")}</span>
    </div>
  );
}

function ChoiceScreen({
  title,
  text,
  nextLabel,
  onNext,
  onRepeat,
  onEnd
}: {
  title: string;
  text: string;
  nextLabel: string;
  onNext: () => void;
  onRepeat: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="choice-screen">
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="button-row">
        <button className="primary-button" onClick={onNext}>
          <ArrowRight aria-hidden="true" />
          {nextLabel}
        </button>
        <button className="secondary-button" onClick={onRepeat}>
          <RotateCcw aria-hidden="true" />
          Wiederholen
        </button>
        <button className="secondary-button" onClick={onEnd}>
          <Home aria-hidden="true" />
          Ende
        </button>
      </div>
    </div>
  );
}

function EndScreen({
  totals,
  percentRight,
  showWin,
  onRepeat,
  onEnd
}: {
  totals: Totals;
  percentRight: number;
  showWin: boolean;
  onRepeat: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="choice-screen">
      {showWin ? (
        <>
          <Trophy className="trophy" aria-hidden="true" />
          <h2>Super gemacht! Du bist ein Alphabet-Profi! 🏆</h2>
        </>
      ) : (
        <h2>Gut geübt.</h2>
      )}
      <div className="summary-grid">
        <StatusItem label="Richtig" value={totals.right.toString()} tone="right" />
        <StatusItem label="Falsch" value={totals.wrong.toString()} tone="wrong" />
        <StatusItem label="Prozent richtig" value={`${percentRight} %`} />
      </div>
      <div className="button-row">
        <button className="primary-button" onClick={onRepeat}>
          <RotateCcw aria-hidden="true" />
          Wiederholen
        </button>
        <button className="secondary-button" onClick={onEnd}>
          <Home aria-hidden="true" />
          Ende
        </button>
      </div>
    </div>
  );
}

function GoodbyeScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="choice-screen">
      <h2>Fertig.</h2>
      <p>Gut geübt. Bis bald.</p>
      <div className="button-row">
        <button className="primary-button" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          Neu starten
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties} />
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
