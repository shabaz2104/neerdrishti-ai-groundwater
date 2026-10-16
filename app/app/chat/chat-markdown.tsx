import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800" key={key}>
          {token.slice(1, -1)}
        </code>
      );
    }
    return <span key={key}>{token}</span>;
  });
}

export default function ChatMarkdown({ content }: { content: string }) {
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listType: "ordered" | "unordered" | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    blocks.push(
      <p className="whitespace-pre-wrap" key={`paragraph-${blocks.length}`}>
        {renderInline(paragraph.join(" "), `paragraph-${blocks.length}`)}
      </p>,
    );
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0 || !listType) {
      return;
    }

    const ListTag = listType === "ordered" ? "ol" : "ul";
    blocks.push(
      <ListTag
        className={listType === "ordered" ? "list-decimal pl-5" : "list-disc pl-5"}
        key={`list-${blocks.length}`}
      >
        {list.map((item, index) => (
          <li key={`list-item-${index}`}>{renderInline(item, `list-${blocks.length}-${index}`)}</li>
        ))}
      </ListTag>,
    );
    list = [];
    listType = null;
  }

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    const unorderedItem = /^[-*]\s+(.+)$/.exec(line.trim());
    const orderedItem = /^\d+[.)]\s+(.+)$/.exec(line.trim());

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const HeadingTag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      blocks.push(
        <HeadingTag className="font-semibold text-slate-950" key={`heading-${blocks.length}`}>
          {renderInline(heading[2], `heading-${blocks.length}`)}
        </HeadingTag>,
      );
      continue;
    }

    if (unorderedItem || orderedItem) {
      flushParagraph();
      const nextType = unorderedItem ? "unordered" : "ordered";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      list.push((unorderedItem ?? orderedItem)?.[1] ?? "");
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return <div className="space-y-3">{blocks}</div>;
}
