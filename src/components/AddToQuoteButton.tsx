interface Props {
  sku: string;
  title: string;
}

export default function AddToQuoteButton({ sku, title }: Props) {
  return (
    <button
      className="btn btn--accent"
      type="button"
      onClick={() => {
        (window as unknown as { addToQuote?: (item: { sku: string; title: string }) => void }).addToQuote?.({
          sku,
          title,
        });
      }}
    >
      Добавить в заявку
    </button>
  );
}
