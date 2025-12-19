import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Paper {
  id: string;
  title: string;
  year: string;
  type: string;
  subject: string;
  school: string;
  level: string;
  s3_url: string;
}

interface PaperListProps {
  papers: Paper[];
}

type FilterState = {
  school: string[];
  subject: string[];
  level: string[];
  year: string[];
  type: string[];
};

const initialFilters: FilterState = {
  school: [],
  subject: [],
  level: [],
  year: [],
  type: [],
};

export default function PaperList({ papers }: PaperListProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const uniqueOptions = useMemo(() => {
    const buildOptions = (key: keyof Paper) => {
      const values = Array.from(
        new Set(
          papers
            .map((paper) => paper[key])
            .filter(Boolean)
            .map((value) => value.trim())
        )
      );
      return values.sort((a, b) => a.localeCompare(b));
    };

    const years = Array.from(
      new Set(papers.map((paper) => paper.year).filter(Boolean))
    ).sort((a, b) => Number(b) - Number(a));

    return {
      schools: buildOptions("school"),
      subjects: buildOptions("subject"),
      levels: buildOptions("level"),
      types: buildOptions("type"),
      years,
    };
  }, [papers]);

  const matchList = (selected: string[], value: string) =>
    selected.length === 0 ? true : selected.includes(value);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const matchesSchool = matchList(filters.school, paper.school);
      const matchesSubject = matchList(filters.subject, paper.subject);
      const matchesLevel = matchList(filters.level, paper.level);
      const matchesYear = matchList(filters.year, paper.year);
      const matchesType = matchList(filters.type, paper.type);

      return (
        matchesSchool &&
        matchesSubject &&
        matchesLevel &&
        matchesYear &&
        matchesType
      );
    });
  }, [papers, filters]);

  // live number of matching papers
  const previewCount = filteredPapers.length;

  // Page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<
    Record<keyof FilterState, boolean>
  >({
    school: false,
    subject: false,
    level: false,
    year: false,
    type: false,
  });

  // open only one dropdown bar
  const setOnlyExpanded = (key?: keyof FilterState) => {
    setExpandedGroups(() => ({
      school: key === "school",
      subject: key === "subject",
      level: key === "level",
      year: key === "year",
      type: key === "type",
    }));
  };

  // Reset page to 1 when filters changes
  useEffect(() => {
    setPage(1);
  }, [filters, papers]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / PAGE_SIZE));

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 1) setPage(1);
      return;
    }

    // Clamp page into [1, totalPages]
    const clamped = Math.min(Math.max(page, 1), totalPages);
    if (clamped !== page) setPage(clamped);
  }, [page, totalPages]);

  const displayPapers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPapers.slice(start, start + PAGE_SIZE);
  }, [filteredPapers, page]);

  const toggleDraft = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const exists = prev[key].includes(value);
      const next = {
        ...prev,
        [key]: exists
          ? prev[key].filter((item) => item !== value)
          : [...prev[key], value],
      };
      if (next[key].length > 0) setOnlyExpanded(key);
      else setOnlyExpanded();
      return next;
    });
  };

  // reset one filter
  const resetGroup = (key: keyof FilterState) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
    setPage(1);
    setOnlyExpanded();
  };

  // reset all filters
  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    setOnlyExpanded();
  };

  function CheckboxGroup({
    label,
    fk,
    options,
    placeholder,
  }: {
    label: string;
    fk: keyof FilterState;
    options: string[];
    placeholder: string;
  }) {
    const selected = filters[fk];
    const selectedCount = selected.length;
    const summary = selectedCount === 0 ? "" : `${selectedCount} selected`;
    const expanded = expandedGroups[fk];
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
      if (!expanded) return;
      const update = () => {
        const el = wrapperRef.current;
        if (el) setRect(el.getBoundingClientRect());
      };
      update();
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }, [expanded]);

    const dropdown = (
      <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
        {options.length === 0 && (
          <span className="text-xs text-slate-500">No options</span>
        )}
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleDraft(fk, option)}
                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    );

    return (
      <div className="relative" ref={wrapperRef}>
        <div className="rounded-xl border border-slate-200 bg-white/80 shadow-sm">
          <div
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-900 cursor-pointer"
            onClick={() => setOnlyExpanded(expanded ? undefined : fk)}>
            <span>{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-slate-600">
                {summary}
              </span>
              {options.length > 0
                ? (() => {
                    const hasSelection = selected.length > 0;
                    const btnLabel = hasSelection ? "Reset" : placeholder;
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSelection) {
                            resetGroup(fk);
                          } else {
                            setFilters((prev) => {
                              const next = {
                                ...prev,
                                [fk]: options,
                              };
                              setOnlyExpanded(fk);
                              return next;
                            });
                          }
                        }}
                        className="text-xs text-slate-600 hover:text-slate-800">
                        {btnLabel}
                      </button>
                    );
                  })()
                : null}
            </div>
          </div>
        </div>

        {expanded &&
          (typeof window !== "undefined" && rect
            ? createPortal(
                <div
                  className="z-50 rounded-lg border border-slate-200 bg-white shadow-lg px-3 py-3 text-sm text-slate-800"
                  style={{
                    position: "fixed",
                    left: rect.left,
                    top: rect.bottom + 8,
                    width: rect.width,
                  }}>
                  {dropdown}
                </div>,
                document.body
              )
            : // fallback for SSR / before rect available
              rect === null && (
                <div className="absolute z-40 left-0 right-0 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg px-3 py-3 text-sm text-slate-800">
                  {dropdown}
                </div>
              ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {papers.length === 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          No papers were loaded. If this is unexpected, check that the GraphQL
          fetch in `src/pages/pyp.astro` succeeded and that your
          `HASURA_ADMIN_SECRET` is set when running the dev server.
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Filter papers
            </p>
            <p className="text-xs text-slate-500">
              Select multiple values per category — filters apply automatically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
              {previewCount} {previewCount === 1 ? "paper" : "papers"} found
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
              Reset
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <CheckboxGroup
            label="School"
            fk="school"
            options={uniqueOptions.schools}
            placeholder="All schools"
          />
          <CheckboxGroup
            label="Subject"
            fk="subject"
            options={uniqueOptions.subjects}
            placeholder="All subjects"
          />
          <CheckboxGroup
            label="Level"
            fk="level"
            options={uniqueOptions.levels}
            placeholder="All levels"
          />
          <CheckboxGroup
            label="Year"
            fk="year"
            options={uniqueOptions.years}
            placeholder="All years"
          />
          <CheckboxGroup
            label="Type"
            fk="type"
            options={uniqueOptions.types}
            placeholder="All types"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filteredPapers.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-600">
            No papers match the selected filters.
          </div>
        )}

        {displayPapers.map((paper) => {
          return (
            <a
              key={paper.id}
              target="_blank"
              rel="noreferrer"
              className={`flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`}
              href={`https://pyps.s3.ap-southeast-1.amazonaws.com/${paper.s3_url}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  {paper.school}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {paper.level} · {paper.subject}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-800">
                  {paper.year}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-800">
                  {paper.type}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || totalPages === 0}
          className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 disabled:opacity-40">
          Previous
        </button>
        <div className="text-sm text-slate-700">
          Page {page} of {totalPages}
        </div>
        <button
          type="button"
          onClick={() => {
            if (totalPages > 0) setPage((p) => Math.min(totalPages, p + 1));
          }}
          disabled={page >= totalPages || totalPages === 0}
          className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}
