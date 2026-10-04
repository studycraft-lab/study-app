type BatchResult = { correct?: boolean; status?: "correct" | "incorrect" | "review" };
type Batch = { batchIndex: number; results: BatchResult[] };

export function GrammarBatchNavigation({ batchCount, batchSize, batches, currentIndex, onOpen }: {
  batchCount: number;
  batchSize: number;
  batches: Batch[];
  currentIndex: number;
  onOpen: (index: number) => void;
}) {
  return <div className="grammar-batch-nav" aria-label="Question batches">
    {Array.from({ length: batchCount }, (_, index) => {
      const batch = batches.find((item) => item.batchIndex === index);
      const correct = batch?.results.filter((result) => result.correct === true || result.status === "correct").length ?? 0;
      const review = batch?.results.filter((result) => result.status === "review").length ?? 0;
      const state = !batch ? "" : correct === batchSize ? "is-perfect" : review ? "is-review" : "is-partial";
      const summary = !batch ? "not checked" : `${correct} of ${batchSize} correct${review ? `, ${review} ${review === 1 ? "answer" : "answers"} needs review` : ""}`;
      return <button key={index} type="button" aria-label={`Batch ${index + 1}: ${summary}`}
        aria-current={index === currentIndex ? "step" : undefined}
        className={[state, index === currentIndex ? "is-current" : ""].filter(Boolean).join(" ")}
        onClick={() => onOpen(index)}>
        <span>{index + 1}</span><small aria-hidden="true">{batch ? `${correct}/${batchSize}${review ? " ?" : ""}` : "New"}</small>
      </button>;
    })}
    <p className="grammar-batch-legend">Green: all correct · Amber: try again · Purple: answer needs review</p>
  </div>;
}
