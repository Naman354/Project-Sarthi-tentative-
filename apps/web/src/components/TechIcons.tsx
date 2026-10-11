import React from "react";

interface TechIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TechLogo({ name, className = "w-4 h-4", style }: TechIconProps) {
  const norm = name.toLowerCase().trim();

  // TypeScript
  if (norm === "typescript" || norm === "ts") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <rect width="24" height="24" rx="4" fill="#3178C6" />
        <path
          d="M11.5 13.5H9.3V7.2H7V5.5h6.8v1.7h-2.3v6.3zm3.2.1c.9 0 1.6-.3 2.1-.8.5-.5.8-1.2.8-2 0-.6-.2-1.2-.5-1.6-.3-.4-.9-.8-1.7-1.1-.6-.2-1-.4-1.2-.6-.2-.2-.3-.4-.3-.7 0-.3.1-.6.4-.8.3-.2.6-.3 1.1-.3.5 0 .9.1 1.2.4.3.3.5.7.5 1.2h1.6c0-.9-.4-1.6-1.1-2.1-.7-.5-1.5-.7-2.3-.7-.9 0-1.7.3-2.2.8-.5.5-.8 1.2-.8 2 0 .6.2 1.1.5 1.5.3.4.9.8 1.7 1.1.6.2 1 .4 1.2.6.2.2.3.4.3.7 0 .3-.1.6-.4.8-.3.2-.7.3-1.2.3-.6 0-1.1-.2-1.4-.5-.4-.3-.6-.8-.6-1.4h-1.6c0 1 .4 1.8 1.1 2.3.7.6 1.7.9 2.7.9z"
          fill="#FFF"
        />
      </svg>
    );
  }

  // JavaScript
  if (norm === "javascript" || norm === "js") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <rect width="24" height="24" rx="4" fill="#F7DF1E" />
        <path
          d="M6 18.5l1.6-.9c.3.6.7 1 1.3 1 .6 0 1-.3 1-1.1v-6h1.9v6.1c0 1.9-1.1 2.8-2.8 2.8-1.5 0-2.5-.8-3-1.9zm7.3-.2l1.6-.9c.4.7.9 1.1 1.7 1.1.8 0 1.3-.4 1.3-1 0-.6-.5-.9-1.4-1.3l-.5-.2c-1.4-.6-2.3-1.4-2.3-2.8 0-1.4 1.1-2.5 2.8-2.5 1.2 0 2.1.5 2.7 1.6l-1.5 1c-.3-.6-.7-.8-1.2-.8-.6 0-1 .3-1 .8 0 .5.4.8 1.2 1.1l.5.2c1.6.7 2.5 1.5 2.5 3 0 1.7-1.3 2.7-3.2 2.7-1.8 0-3-1-3.4-2z"
          fill="#000"
        />
      </svg>
    );
  }

  // React
  if (norm === "react" || norm === "reactjs") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.5" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#61DAFB"
          strokeWidth="1.5"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#61DAFB"
          strokeWidth="1.5"
          transform="rotate(120 12 12)"
        />
        <circle cx="12" cy="12" r="1.8" fill="#61DAFB" />
      </svg>
    );
  }

  // Next.js
  if (norm === "next.js" || norm === "nextjs" || norm === "next") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="11" fill="#000" stroke="#333" strokeWidth="1" />
        <path
          d="M15.5 17.5L8.8 8.6h-1.6v6.8h1.4v-4.8l5.9 7.9h1zm.5-6.8h1.4v6.8H16v-6.8z"
          fill="#FFF"
        />
      </svg>
    );
  }

  // Node.js
  if (norm === "node" || norm === "node.js" || norm === "nodejs") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2l9 5.2v10.4L12 22.8 3 17.6V7.2L12 2zm0 2.3L4.8 8.5v7l7.2 4.2 7.2-4.2v-7L12 4.3z"
          fill="#5FA04E"
        />
        <path
          d="M12 8.5a3.5 3.5 0 00-3.5 3.5c0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5c0-1.9-1.6-3.5-3.5-3.5z"
          fill="#5FA04E"
        />
      </svg>
    );
  }

  // Express
  if (norm === "express" || norm === "expressjs") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <rect width="24" height="24" rx="4" fill="#203538" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#35D0C3"
          fontFamily="monospace"
        >
          ex
        </text>
      </svg>
    );
  }

  // Python
  if (norm === "python" || norm === "py") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
        <path
          d="M11.9 2c-3.1 0-4.9.4-4.9 2.2v2.2h5v.8H5.6C3.8 7.2 2 9 2 11.8s1.6 4.6 3.6 4.6h1.2v-2.3c0-1.7 1.5-3.1 3.2-3.1h4.9c1.4 0 2.5-1.1 2.5-2.5V4.2C17.4 2.4 15.1 2 11.9 2zm-1.4 1.4a.8.8 0 110 1.6.8.8 0 010-1.6z"
          fill="#3776AB"
        />
        <path
          d="M12.1 22c3.1 0 4.9-.4 4.9-2.2v-2.2h-5v-.8h6.4c1.8 0 3.6-1.8 3.6-4.6s-1.6-4.6-3.6-4.6h-1.2v2.3c0 1.7-1.5 3.1-3.2 3.1h-4.9c-1.4 0-2.5 1.1-2.5 2.5v4.3c0 1.8 2.3 2.2 5.5 2.2zm1.4-1.4a.8.8 0 110-1.6.8.8 0 010 1.6z"
          fill="#FFD43B"
        />
      </svg>
    );
  }

  // Flask
  if (norm === "flask") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M10 2h4v2h-1v4.5l5.5 9.5c.8 1.4-.2 3-1.8 3H7.3c-1.6 0-2.6-1.6-1.8-3L11 8.5V4h-1V2zm1 8.5L7.5 18h9L13 10.5V4h-2v6.5z"
          fill="#9AA9AC"
        />
      </svg>
    );
  }

  // FastAPI
  if (norm === "fastapi") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#009688" />
        <path d="M13 4L6 14h5l-1 6 7-10h-5l1-6z" fill="#FFF" />
      </svg>
    );
  }

  // Rust / Cargo
  if (norm === "rust" || norm === "cargo") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#F28C45" opacity="0.2" />
        <path
          d="M12 4a8 8 0 100 16 8 8 0 000-16zm-2 5h4a2 2 0 010 4h-2v3H9V9h1zm1.5 1.5v1h2a.5.5 0 000-1h-2z"
          fill="#F28C45"
        />
      </svg>
    );
  }

  // Go / Golang
  if (norm === "go" || norm === "golang") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#00ADD8" opacity="0.2" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#00ADD8"
          fontFamily="monospace"
        >
          GO
        </text>
      </svg>
    );
  }

  // Docker
  if (norm === "docker") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="10" width="3" height="3" rx="0.5" fill="#2496ED" />
        <rect x="6" y="10" width="3" height="3" rx="0.5" fill="#2496ED" />
        <rect x="10" y="10" width="3" height="3" rx="0.5" fill="#2496ED" />
        <rect x="6" y="6" width="3" height="3" rx="0.5" fill="#2496ED" />
        <rect x="10" y="6" width="3" height="3" rx="0.5" fill="#2496ED" />
        <path
          d="M21.5 13c-.5-1.2-1.7-1.8-2.5-1.7-.5-1.2-1.7-2-3-2H2v3c0 3.3 2.7 6 6 6h6c4.4 0 7.5-2.5 7.5-5.3z"
          fill="#2496ED"
        />
      </svg>
    );
  }

  // Tailwind / TailwindCSS
  if (norm === "tailwind" || norm === "tailwindcss") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 6c-2.4 0-3.9 1.2-4.5 3.6 1-.8 2-.9 3-.3.6.3 1 .8 1.5 1.4 1 1 2.2 1.9 4.5 1.9 2.4 0 3.9-1.2 4.5-3.6-1 .8-2 .9-3 .3-.6-.3-1-.8-1.5-1.4-1-1-2.2-1.9-4.5-1.9zm-6 6c-2.4 0-3.9 1.2-4.5 3.6 1-.8 2-.9 3-.3.6.3 1 .8 1.5 1.4 1 1 2.2 1.9 4.5 1.9 2.4 0 3.9-1.2 4.5-3.6-1 .8-2 .9-3 .3-.6-.3-1-.8-1.5-1.4-1-1-2.2-1.9-4.5-1.9z"
          fill="#38BDF8"
        />
      </svg>
    );
  }

  // Git / GitHub Actions
  if (norm === "git" || norm === "github" || norm === "github actions") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#F05032" opacity="0.15" />
        <path
          d="M12 6a2 2 0 100 4 2 2 0 000-4zm-4 8a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"
          fill="#F05032"
        />
        <path d="M12 10v4M8 14h8" stroke="#F05032" strokeWidth="1.5" />
      </svg>
    );
  }

  // Database (Prisma, Postgres, etc.)
  if (norm.includes("sql") || norm.includes("db") || norm === "prisma" || norm === "postgres") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
        <ellipse
          cx="12"
          cy="6"
          rx="8"
          ry="3"
          fill="#4D9FD8"
          fillOpacity="0.2"
          stroke="#4D9FD8"
          strokeWidth="1.5"
        />
        <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" stroke="#4D9FD8" strokeWidth="1.5" />
        <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="#4D9FD8" strokeWidth="1.5" />
      </svg>
    );
  }

  // Default clean code chip icon
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}
