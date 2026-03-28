"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getArticleStatusLabel } from "@/lib/article-state";
import type { UpdateCalendarDay, UpdateCalendarMonth } from "@/lib/types";

type Props = {
  months: UpdateCalendarMonth[];
  title?: string;
};

type HoveredDay = {
  date: string;
  entries: UpdateCalendarDay["entries"];
  top: number;
  left: number;
  placement: "top" | "bottom";
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function buildDayLabel(entries: UpdateCalendarDay["entries"]) {
  if (entries.length === 0) {
    return "";
  }

  return entries.map((entry) => `${getArticleStatusLabel(entry.kind)}: ${entry.article.title}`).join(" / ");
}

export function UpdateCalendar({
  months,
  title = "更新カレンダー"
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hoveredDay) {
      return;
    }

    const dismiss = () => setHoveredDay(null);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);

    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [hoveredDay]);

  function clearHideTimer() {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function scheduleHideTooltip() {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setHoveredDay(null);
    }, 120);
  }

  function showTooltip(day: UpdateCalendarDay, element: HTMLDivElement) {
    clearHideTimer();

    const rect = element.getBoundingClientRect();
    const placement = rect.top < 260 ? "bottom" : "top";
    const tooltipWidth = Math.min(300, window.innerWidth - 56);
    const tooltipHalf = tooltipWidth / 2;
    const center = rect.left + rect.width / 2;
    const left = Math.min(window.innerWidth - tooltipHalf - 12, Math.max(tooltipHalf + 12, center));

    setHoveredDay({
      date: day.date,
      entries: day.entries,
      left,
      top: placement === "top" ? rect.top - 8 : rect.bottom + 8,
      placement
    });
  }

  return (
    <section className="section-shell update-shell">
      <div className="section-head">
        <div className="section-kicker">Updates</div>
        <h2>{title}</h2>
      </div>

      <div className="calendar-month-list">
        {months.map((month) => (
          <section key={month.key} className="calendar-month-card">
            <div className="calendar-month-head">
              <h3>{month.label}</h3>
            </div>

            <div className="calendar-weekdays">
              {weekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {month.weeks.flat().map((day) => {
                const className = [
                  "calendar-day",
                  day.inMonth ? "" : "calendar-day-muted",
                  day.updateCount > 0 ? "calendar-day-active" : "",
                  day.isToday ? "calendar-day-today" : ""
                ]
                  .filter(Boolean)
                  .join(" ");

                if (day.entries.length > 0) {
                  const primaryEntry = day.entries[0];
                  const dayLabel = buildDayLabel(day.entries);

                  return (
                    <div
                      key={day.date}
                      className={`${className} calendar-day-tooltip-trigger`}
                      onMouseEnter={(event) => showTooltip(day, event.currentTarget)}
                      onMouseLeave={scheduleHideTooltip}
                    >
                      <Link
                        href={primaryEntry.article.url}
                        className="calendar-day-link"
                        aria-label={`${day.dayNumber}日 ${dayLabel}`}
                      >
                        <span className="calendar-day-number">{day.dayNumber}</span>
                      </Link>
                    </div>
                  );
                }

                return (
                  <div key={day.date} className={className}>
                    <span className="calendar-day-number">{day.dayNumber}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {isMounted && hoveredDay
        ? createPortal(
            <div
              className={`calendar-day-tooltip calendar-day-tooltip-floating calendar-day-tooltip-${hoveredDay.placement}`}
              style={{
                left: hoveredDay.left,
                top: hoveredDay.top
              }}
              onMouseEnter={clearHideTimer}
              onMouseLeave={scheduleHideTooltip}
            >
              <div className="calendar-day-tooltip-list">
                {hoveredDay.entries.map((entry) => (
                  <Link
                    key={`${hoveredDay.date}-${entry.kind}-${entry.article.slug}`}
                    href={entry.article.url}
                    className="calendar-day-tooltip-item"
                  >
                    {entry.article.title}
                  </Link>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
