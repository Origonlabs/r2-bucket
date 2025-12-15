const createNotFound = (): Response =>
	new Response("Not Found", {
		status: 404,
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"cache-control": "no-store",
		},
	});

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/") {
			return new Response(getShell(), {
				headers: {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "no-store",
				},
			});
		}

		if (url.pathname === "/api/objects" && request.method === "GET") {
			return listObjects(env, url);
		}

		if (url.pathname.startsWith("/api/objects/") && request.method === "GET") {
			return streamObject(env, url);
		}

		return createNotFound();
	},
} satisfies ExportedHandler<Env>;

const listObjects = async (env: Env, url: URL): Promise<Response> => {
	const prefix = url.searchParams.get("prefix") ?? undefined;
	const cursor = url.searchParams.get("cursor") ?? undefined;

	const result = await env.bucket.list({
		limit: 1000,
		prefix,
		cursor,
		delimiter: "/",
		include: ["httpMetadata", "customMetadata"],
	});

	return json({
		objects: result.objects.map((object) => ({
			key: object.key,
			size: object.size,
			uploaded: object.uploaded?.toISOString() ?? null,
			checksum: object.checksums?.sha256
				? Array.from(new Uint8Array(object.checksums.sha256))
						.map((byte) => byte.toString(16).padStart(2, "0"))
						.join("")
				: null,
			etag: object.httpEtag ?? null,
			metadata: object.customMetadata ?? {},
		})),
		delimitedPrefixes: result.delimitedPrefixes ?? [],
		cursor: result.truncated ? result.cursor : null,
		truncated: result.truncated,
	});
};

const streamObject = async (env: Env, url: URL): Promise<Response> => {
	const key = decodeURIComponent(url.pathname.replace("/api/objects/", ""));

	if (!key) {
		return new Response("Object key is required", {
			status: 400,
			headers: { "content-type": "text/plain; charset=utf-8" },
		});
	}

	const object = await env.bucket.get(key);

	if (!object) {
		return createNotFound();
	}

	const headers = new Headers();
	headers.set("etag", object.httpEtag ?? "");
	headers.set("content-length", object.size.toString());
	headers.set("content-type", object.httpMetadata?.contentType ?? "application/octet-stream");
	headers.set("cache-control", "no-store");

	const disposition = url.searchParams.get("download");
	if (disposition === "1") {
		headers.set("content-disposition", `attachment; filename="${encodeFilename(key)}"`);
	}

	return new Response(object.body, { headers });
};

const encodeFilename = (value: string): string => {
	return value.replace(/[\r\n"]/g, "_");
};

const json = (data: unknown, init?: ResponseInit): Response => {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			...(init?.headers ?? {}),
		},
	});
};

const getShell = (): string => {
	return `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>R2 Storage Console</title>
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
		<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" crossorigin="anonymous"></script>
		<style>
			:root {
				color-scheme: dark;
				/* Design Tokens - Superior System */
				--color-bg-primary: #000000;
				--color-bg-secondary: #0a0a0a;
				--color-bg-tertiary: #111111;
				--color-surface-1: rgba(255, 255, 255, 0.03);
				--color-surface-2: rgba(255, 255, 255, 0.05);
				--color-surface-3: rgba(255, 255, 255, 0.08);
				--color-border-subtle: rgba(255, 255, 255, 0.06);
				--color-border-default: rgba(255, 255, 255, 0.1);
				--color-border-strong: rgba(255, 255, 255, 0.18);
				--color-text-primary: rgba(255, 255, 255, 0.95);
				--color-text-secondary: rgba(255, 255, 255, 0.65);
				--color-text-tertiary: rgba(255, 255, 255, 0.45);
				--color-text-inverse: rgba(0, 0, 0, 0.9);
				--color-accent-1: rgba(99, 102, 241, 0.1);
				--color-accent-2: rgba(139, 92, 246, 0.1);
				--gradient-ambient: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent 60%);
				--gradient-panel: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
				--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
				--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.12);
				--shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.24), 0 4px 16px rgba(0, 0, 0, 0.16);
				--shadow-xl: 0 24px 96px rgba(0, 0, 0, 0.32), 0 8px 32px rgba(0, 0, 0, 0.24);
				--radius-sm: 8px;
				--radius-md: 12px;
				--radius-lg: 16px;
				--radius-xl: 24px;
				--spacing-xs: 0.25rem;
				--spacing-sm: 0.5rem;
				--spacing-md: 1rem;
				--spacing-lg: 1.5rem;
				--spacing-xl: 2rem;
				--spacing-2xl: 3rem;
				--blur-sm: 8px;
				--blur-md: 16px;
				--blur-lg: 24px;
				--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
				--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
				--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
				--transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
				font-synthesis: none;
			}

			@keyframes shimmer {
				0% { transform: translateX(-100%); }
				100% { transform: translateX(100%); }
			}

			@keyframes float {
				0%, 100% { transform: translateY(0px); }
				50% { transform: translateY(-4px); }
			}

			@keyframes pulse-glow {
				0%, 100% { opacity: 1; }
				50% { opacity: 0.6; }
			}

			@keyframes gradient-shift {
				0%, 100% { background-position: 0% 50%; }
				50% { background-position: 100% 50%; }
			}

			@keyframes fade-in-up {
				from {
					opacity: 0;
					transform: translateY(8px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			@keyframes scale-in {
				from {
					opacity: 0;
					transform: scale(0.96);
				}
				to {
					opacity: 1;
					transform: scale(1);
				}
			}

			* {
				box-sizing: border-box;
				margin: 0;
				padding: 0;
			}

			body {
				min-height: 100vh;
				font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
				background: var(--color-bg-primary);
				color: var(--color-text-primary);
				overflow-x: hidden;
				position: relative;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			}

			body::before {
				content: "";
				position: fixed;
				inset: 0;
				background: var(--gradient-ambient);
				pointer-events: none;
				z-index: 0;
			}

			body::after {
				content: "";
				position: fixed;
				inset: 0;
				background:
					radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
					radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
				pointer-events: none;
				z-index: 0;
				animation: gradient-shift 20s ease infinite;
				background-size: 200% 200%;
			}

			.app-shell {
				position: relative;
				z-index: 1;
				width: min(1400px, calc(100% - 2rem));
				margin: 0 auto;
				padding: var(--spacing-2xl) 0;
				display: flex;
				flex-direction: column;
				gap: var(--spacing-lg);
				animation: fade-in-up var(--transition-slow) ease-out;
			}

			.panel {
				position: relative;
				background: var(--gradient-panel), var(--color-surface-1);
				border: 1px solid var(--color-border-default);
				border-radius: var(--radius-xl);
				padding: var(--spacing-xl);
				overflow: hidden;
				box-shadow: var(--shadow-lg);
			}

			.panel::before {
				content: "";
				position: absolute;
				inset: 0;
				border-radius: inherit;
				padding: 1px;
				background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
				-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
				-webkit-mask-composite: xor;
				mask-composite: exclude;
				pointer-events: none;
			}

			.panel::after {
				content: "";
				position: absolute;
				inset: -100px;
				background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.06) 0%, transparent 40%);
				opacity: 0;
				transition: opacity var(--transition-base);
				pointer-events: none;
			}

			.panel:hover::after {
				opacity: 1;
			}

			.glass-effect {
				backdrop-filter: blur(var(--blur-md)) saturate(180%);
				-webkit-backdrop-filter: blur(var(--blur-md)) saturate(180%);
			}

			header {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: var(--spacing-lg);
				margin-bottom: var(--spacing-xl);
			}

			.header-content {
				flex: 1;
			}

			.brand {
				display: flex;
				align-items: center;
				gap: var(--spacing-md);
				margin-bottom: var(--spacing-md);
			}

			.logo {
				width: 52px;
				height: 52px;
				border-radius: var(--radius-md);
				background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(200, 200, 200, 0.95) 100%);
				position: relative;
				overflow: hidden;
				box-shadow: var(--shadow-md);
				transition: transform var(--transition-base), box-shadow var(--transition-base);
			}

			.logo:hover {
				transform: translateY(-2px) scale(1.02);
				box-shadow: var(--shadow-lg);
			}

			.logo::before {
				content: "";
				position: absolute;
				inset: 0;
				background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.4) 100%);
			}

			.logo::after {
				content: "";
				position: absolute;
				inset: 10px;
				border-radius: 6px;
				background: var(--color-bg-primary);
				mask: radial-gradient(circle at 32% 32%, transparent 30%, #000 32%);
			}

			.brand-text {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-xs);
			}

			.brand-label {
				font-size: 0.8125rem;
				font-weight: 500;
				color: var(--color-text-tertiary);
				text-transform: uppercase;
				letter-spacing: 0.05em;
			}

			.brand-name {
				font-size: 1.125rem;
				font-weight: 600;
				color: var(--color-text-primary);
			}

			h1 {
				font-size: clamp(2rem, 5vw, 3.5rem);
				font-weight: 700;
				background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
				margin-bottom: var(--spacing-sm);
				line-height: 1.1;
				letter-spacing: -0.02em;
			}

			.status-bar {
				display: flex;
				align-items: center;
				gap: var(--spacing-sm);
				margin-top: var(--spacing-md);
			}

			.status {
				display: inline-flex;
				align-items: center;
				gap: var(--spacing-sm);
				color: var(--color-text-secondary);
				font-size: 0.9375rem;
				font-weight: 500;
			}

			.status-indicator {
				width: 6px;
				height: 6px;
				border-radius: 50%;
				background: currentColor;
				animation: pulse-glow 2s ease-in-out infinite;
			}

			.status[data-state="loading"] .status-indicator {
				background: rgba(59, 130, 246, 0.8);
			}

			.status[data-state="ready"] .status-indicator {
				background: rgba(34, 197, 94, 0.8);
				animation: none;
			}

			.status[data-state="error"] .status-indicator {
				background: rgba(239, 68, 68, 0.8);
			}

			.actions {
				display: flex;
				gap: var(--spacing-sm);
				flex-shrink: 0;
			}

			.breadcrumbs {
				display: flex;
				align-items: center;
				gap: var(--spacing-xs);
				margin-bottom: var(--spacing-lg);
				padding: var(--spacing-sm) var(--spacing-md);
				background: var(--color-surface-1);
				border: 1px solid var(--color-border-subtle);
				border-radius: var(--radius-lg);
				overflow-x: auto;
				flex-wrap: wrap;
			}

			.breadcrumb-item {
				display: inline-flex;
				align-items: center;
				gap: var(--spacing-xs);
				padding: var(--spacing-xs) var(--spacing-sm);
				background: transparent;
				border: none;
				border-radius: var(--radius-sm);
				color: var(--color-text-secondary);
				font-size: 0.875rem;
				font-weight: 500;
				cursor: pointer;
				transition: all var(--transition-fast);
				white-space: nowrap;
			}

			.breadcrumb-item svg {
				width: 16px;
				height: 16px;
			}

			.breadcrumb-item:hover {
				background: var(--color-surface-2);
				color: var(--color-text-primary);
			}

			.breadcrumb-item:last-child {
				color: var(--color-text-primary);
				font-weight: 600;
				pointer-events: none;
			}

			.breadcrumb-separator {
				color: var(--color-text-tertiary);
				font-size: 0.875rem;
				user-select: none;
			}

			.search-container {
				position: relative;
				margin-bottom: var(--spacing-lg);
			}

			.search-input {
				width: 100%;
				padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 3rem;
				background: var(--color-surface-2);
				border: 1px solid var(--color-border-default);
				border-radius: var(--radius-lg);
				color: var(--color-text-primary);
				font-size: 0.9375rem;
				font-family: inherit;
				outline: none;
				transition: all var(--transition-base);
			}

			.search-input:focus {
				background: var(--color-surface-3);
				border-color: var(--color-border-strong);
				box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
			}

			.search-input::placeholder {
				color: var(--color-text-tertiary);
			}

			.search-icon {
				position: absolute;
				left: var(--spacing-md);
				top: 50%;
				transform: translateY(-50%);
				width: 20px;
				height: 20px;
				color: var(--color-text-tertiary);
				pointer-events: none;
			}

			button {
				border: none;
				border-radius: var(--radius-md);
				padding: 0.875rem 1.75rem;
				font-weight: 600;
				font-size: 0.9375rem;
				font-family: inherit;
				cursor: pointer;
				transition: all var(--transition-base);
				position: relative;
				overflow: hidden;
				white-space: nowrap;
			}

			button::before {
				content: "";
				position: absolute;
				inset: 0;
				background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
				opacity: 0;
				transition: opacity var(--transition-base);
			}

			button:hover::before {
				opacity: 1;
			}

			button.primary {
				background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%);
				color: var(--color-text-inverse);
				box-shadow: var(--shadow-sm);
			}

			button.primary:hover {
				transform: translateY(-1px);
				box-shadow: var(--shadow-md);
			}

			button.primary:active {
				transform: translateY(0);
			}

			button.secondary {
				background: var(--color-surface-2);
				color: var(--color-text-primary);
				border: 1px solid var(--color-border-default);
			}

			button.secondary:hover {
				background: var(--color-surface-3);
				border-color: var(--color-border-strong);
			}

			button.icon-btn {
				display: inline-flex;
				align-items: center;
				gap: var(--spacing-sm);
			}

			button.icon-btn svg {
				width: 18px;
				height: 18px;
			}

			.grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: var(--spacing-md);
			}

			.skeleton-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: var(--spacing-md);
			}

			.skeleton-card {
				height: 160px;
				border-radius: var(--radius-lg);
				background: linear-gradient(90deg, var(--color-surface-1) 0%, var(--color-surface-2) 50%, var(--color-surface-1) 100%);
				background-size: 200% 100%;
				animation: shimmer 1.5s infinite;
				position: relative;
				overflow: hidden;
			}

			.skeleton-card::after {
				content: "";
				position: absolute;
				inset: 0;
				background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
				transform: translateX(-100%);
				animation: shimmer 2s infinite;
			}

			.object-card {
				position: relative;
				padding: var(--spacing-lg);
				border-radius: var(--radius-lg);
				border: 1px solid var(--color-border-subtle);
				background: var(--gradient-panel), var(--color-surface-1);
				backdrop-filter: blur(var(--blur-sm));
				display: flex;
				flex-direction: column;
				gap: var(--spacing-sm);
				transition: all var(--transition-base);
				animation: scale-in var(--transition-base) ease-out;
				cursor: pointer;
			}

			.object-card::before {
				content: "";
				position: absolute;
				inset: 0;
				border-radius: inherit;
				padding: 1px;
				background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
				-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
				-webkit-mask-composite: xor;
				mask-composite: exclude;
				pointer-events: none;
				opacity: 0;
				transition: opacity var(--transition-base);
			}

			.object-card:hover {
				transform: translateY(-2px);
				border-color: var(--color-border-default);
				background: var(--gradient-panel), var(--color-surface-2);
				box-shadow: var(--shadow-md);
			}

			.object-card:hover::before {
				opacity: 1;
			}

			.object-card:active {
				transform: translateY(0);
			}

			.object-card.folder-card {
				border-color: rgba(99, 102, 241, 0.15);
				background: var(--gradient-panel), rgba(99, 102, 241, 0.03);
			}

			.object-card.folder-card:hover {
				border-color: rgba(99, 102, 241, 0.3);
				background: var(--gradient-panel), rgba(99, 102, 241, 0.06);
			}

			.object-card.folder-card .file-icon {
				background: rgba(99, 102, 241, 0.1);
				border-color: rgba(99, 102, 241, 0.2);
				color: rgba(99, 102, 241, 0.9);
			}

			.card-header {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-sm);
				margin-bottom: var(--spacing-xs);
			}

			.file-icon {
				flex-shrink: 0;
				width: 40px;
				height: 40px;
				border-radius: var(--radius-sm);
				background: var(--color-surface-3);
				border: 1px solid var(--color-border-subtle);
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--color-text-secondary);
			}

			.file-icon svg {
				width: 20px;
				height: 20px;
			}

			.object-card h3 {
				flex: 1;
				font-size: 0.9375rem;
				font-weight: 600;
				color: var(--color-text-primary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				line-height: 1.4;
			}

			.meta-grid {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: var(--spacing-sm);
				margin-top: var(--spacing-xs);
			}

			.meta-item {
				display: flex;
				flex-direction: column;
				gap: 2px;
			}

			.meta-label {
				font-size: 0.6875rem;
				font-weight: 500;
				color: var(--color-text-tertiary);
				text-transform: uppercase;
				letter-spacing: 0.05em;
			}

			.meta-value {
				font-size: 0.8125rem;
				color: var(--color-text-secondary);
				font-weight: 500;
			}

			.card-footer {
				margin-top: var(--spacing-sm);
				padding-top: var(--spacing-sm);
				border-top: 1px solid var(--color-border-subtle);
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.download-link {
				display: inline-flex;
				align-items: center;
				gap: var(--spacing-xs);
				color: var(--color-text-primary);
				text-decoration: none;
				font-size: 0.8125rem;
				font-weight: 600;
				padding: var(--spacing-xs) var(--spacing-sm);
				border-radius: var(--radius-sm);
				background: var(--color-surface-2);
				border: 1px solid var(--color-border-subtle);
				transition: all var(--transition-fast);
			}

			.download-link:hover {
				background: var(--color-surface-3);
				border-color: var(--color-border-default);
				transform: translateY(-1px);
			}

			.download-link svg {
				width: 14px;
				height: 14px;
			}

			.badge {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				border-radius: 999px;
				padding: 0.25rem 0.75rem;
				font-size: 0.6875rem;
				font-weight: 600;
				border: 1px solid var(--color-border-subtle);
				color: var(--color-text-tertiary);
				background: var(--color-surface-1);
				letter-spacing: 0.01em;
			}

			.empty {
				padding: var(--spacing-2xl);
				text-align: center;
				border-radius: var(--radius-lg);
				border: 1px dashed var(--color-border-default);
				background: var(--color-surface-1);
				animation: fade-in-up var(--transition-base) ease-out;
			}

			.empty-icon {
				width: 64px;
				height: 64px;
				margin: 0 auto var(--spacing-lg);
				opacity: 0.3;
			}

			.empty-title {
				font-size: 1.125rem;
				font-weight: 600;
				color: var(--color-text-secondary);
				margin-bottom: var(--spacing-xs);
			}

			.empty-description {
				font-size: 0.9375rem;
				color: var(--color-text-tertiary);
			}

			/* Progress Modal */
			.modal-overlay {
				position: fixed;
				inset: 0;
				background: rgba(0, 0, 0, 0.8);
				backdrop-filter: blur(8px);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 1000;
				animation: fade-in-up var(--transition-base) ease-out;
			}

			.modal {
				width: min(480px, calc(100% - 2rem));
				background: var(--gradient-panel), var(--color-surface-1);
				border: 1px solid var(--color-border-default);
				border-radius: var(--radius-xl);
				padding: var(--spacing-xl);
				box-shadow: var(--shadow-xl);
				animation: scale-in var(--transition-base) ease-out;
			}

			.modal-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: var(--spacing-lg);
			}

			.modal-title {
				font-size: 1.25rem;
				font-weight: 600;
				color: var(--color-text-primary);
			}

			.modal-close {
				width: 32px;
				height: 32px;
				padding: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				background: var(--color-surface-2);
				border: 1px solid var(--color-border-subtle);
				border-radius: var(--radius-sm);
				color: var(--color-text-secondary);
				cursor: pointer;
				transition: all var(--transition-fast);
			}

			.modal-close:hover {
				background: var(--color-surface-3);
				color: var(--color-text-primary);
			}

			.modal-close svg {
				width: 16px;
				height: 16px;
			}

			.progress-info {
				margin-bottom: var(--spacing-md);
			}

			.progress-label {
				font-size: 0.875rem;
				color: var(--color-text-secondary);
				margin-bottom: var(--spacing-xs);
			}

			.progress-stats {
				font-size: 0.75rem;
				color: var(--color-text-tertiary);
				margin-top: var(--spacing-xs);
			}

			.progress-bar-container {
				width: 100%;
				height: 8px;
				background: var(--color-surface-2);
				border-radius: 999px;
				overflow: hidden;
				position: relative;
			}

			.progress-bar {
				height: 100%;
				background: linear-gradient(90deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
				border-radius: 999px;
				transition: width var(--transition-base);
				position: relative;
				overflow: hidden;
			}

			.progress-bar::after {
				content: "";
				position: absolute;
				inset: 0;
				background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
				animation: shimmer 1.5s infinite;
			}

			.download-folder-btn {
				margin-top: var(--spacing-sm);
				width: 100%;
				padding: var(--spacing-sm) var(--spacing-md);
				background: rgba(99, 102, 241, 0.1);
				border: 1px solid rgba(99, 102, 241, 0.2);
				color: rgba(99, 102, 241, 0.9);
				font-size: 0.8125rem;
				font-weight: 600;
				border-radius: var(--radius-sm);
				cursor: pointer;
				transition: all var(--transition-fast);
				display: flex;
				align-items: center;
				justify-content: center;
				gap: var(--spacing-xs);
			}

			.download-folder-btn:hover {
				background: rgba(99, 102, 241, 0.15);
				border-color: rgba(99, 102, 241, 0.3);
				transform: translateY(-1px);
			}

			.download-folder-btn svg {
				width: 14px;
				height: 14px;
			}

			@media (max-width: 768px) {
				.app-shell {
					padding: var(--spacing-lg) 0;
				}

				header {
					flex-direction: column;
					align-items: stretch;
				}

				.actions {
					width: 100%;
				}

				button {
					flex: 1;
				}

				.grid,
				.skeleton-grid {
					grid-template-columns: 1fr;
				}

				h1 {
					font-size: 2rem;
				}
			}

			@media (prefers-reduced-motion: reduce) {
				*,
				*::before,
				*::after {
					animation-duration: 0.01ms !important;
					animation-iteration-count: 1 !important;
					transition-duration: 0.01ms !important;
				}
			}
		</style>
	</head>
	<body>
		<main class="app-shell">
			<section class="panel glass-effect">
				<header>
					<div class="header-content">
						<div class="brand">
							<div class="logo"></div>
							<div class="brand-text">
								<div class="brand-label">Storage</div>
								<div class="brand-name">Cloudflare R2</div>
							</div>
						</div>
						<h1>Storage Console</h1>
						<div class="status-bar">
							<div class="status" id="status">
								<span class="status-indicator"></span>
								<span id="status-text">Initializing...</span>
							</div>
						</div>
					</div>
					<div class="actions">
						<button class="secondary icon-btn" id="refresh">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
							</svg>
							Sync
						</button>
						<button class="primary icon-btn" onclick="window.open('https://dash.cloudflare.com/?to=/:account/r2/overview','_blank')">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
								<polyline points="15 3 21 3 21 9"></polyline>
								<line x1="10" y1="14" x2="21" y2="3"></line>
							</svg>
							Dashboard
						</button>
					</div>
				</header>

				<div id="breadcrumbs" class="breadcrumbs" style="display: none;">
					<button class="breadcrumb-item" data-path="">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
							<polyline points="9 22 9 12 15 12 15 22"></polyline>
						</svg>
						Root
					</button>
				</div>

				<div class="search-container">
					<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
					</svg>
					<input
						type="text"
						id="search"
						class="search-input"
						placeholder="Search files..."
						autocomplete="off"
					/>
				</div>

				<div id="skeleton-loader" class="skeleton-grid">
					<div class="skeleton-card"></div>
					<div class="skeleton-card"></div>
					<div class="skeleton-card"></div>
					<div class="skeleton-card"></div>
				</div>

				<div id="grid" class="grid" aria-live="polite"></div>

				<div id="empty" class="empty" hidden>
					<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
						<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
						<line x1="12" y1="22.08" x2="12" y2="12"></line>
					</svg>
					<div class="empty-title">No objects found</div>
					<div class="empty-description">This bucket doesn't contain any files yet</div>
				</div>
			</section>
		</main>

		<!-- Progress Modal -->
		<div id="progress-modal" class="modal-overlay" style="display: none;">
			<div class="modal">
				<div class="modal-header">
					<h2 class="modal-title">Downloading Folder</h2>
					<button class="modal-close" id="modal-close">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<div class="progress-info">
					<div class="progress-label" id="progress-label">Preparing download...</div>
					<div class="progress-bar-container">
						<div class="progress-bar" id="progress-bar" style="width: 0%"></div>
					</div>
					<div class="progress-stats" id="progress-stats">0 / 0 files</div>
				</div>
			</div>
		</div>

		<script>
			const grid = document.getElementById("grid");
			const status = document.getElementById("status");
			const statusText = document.getElementById("status-text");
			const emptyState = document.getElementById("empty");
			const refreshButton = document.getElementById("refresh");
			const searchInput = document.getElementById("search");
			const skeletonLoader = document.getElementById("skeleton-loader");
			const breadcrumbsContainer = document.getElementById("breadcrumbs");

			let allObjects = [];
			let allFolders = [];
			let filteredObjects = [];
			let currentPrefix = "";

			const getFileIcon = () => \`
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
					<polyline points="13 2 13 9 20 9"></polyline>
				</svg>
			\`;

			const getFolderIcon = () => \`
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
				</svg>
			\`;

			const formatBytes = (bytes) => {
				if (!Number.isFinite(bytes)) return "—";
				const units = ["B", "KB", "MB", "GB", "TB"];
				let index = 0;
				let value = bytes;

				while (value >= 1024 && index < units.length - 1) {
					value /= 1024;
					index++;
				}

				return \`\${value.toFixed(index === 0 ? 0 : 1)} \${units[index]}\`;
			};

			const formatDate = (value) => {
				if (!value) return "—";
				const date = new Date(value);
				const now = new Date();
				const diff = now - date;
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));

				if (days === 0) return "Today";
				if (days === 1) return "Yesterday";
				if (days < 7) return \`\${days} days ago\`;

				return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
			};

			const renderBreadcrumbs = (prefix) => {
				if (!prefix) {
					breadcrumbsContainer.style.display = "none";
					return;
				}

				breadcrumbsContainer.style.display = "flex";
				breadcrumbsContainer.innerHTML = "";

				const parts = prefix.split("/").filter(Boolean);
				let currentPath = "";

				// Root button
				const rootBtn = document.createElement("button");
				rootBtn.className = "breadcrumb-item";
				rootBtn.dataset.path = "";
				rootBtn.innerHTML = \`
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
						<polyline points="9 22 9 12 15 12 15 22"></polyline>
					</svg>
					Root
				\`;
				rootBtn.addEventListener("click", () => navigateToFolder(""));
				breadcrumbsContainer.appendChild(rootBtn);

				// Add separator
				const sep1 = document.createElement("span");
				sep1.className = "breadcrumb-separator";
				sep1.textContent = "/";
				breadcrumbsContainer.appendChild(sep1);

				// Add path parts
				parts.forEach((part, index) => {
					currentPath += part + "/";
					const btn = document.createElement("button");
					btn.className = "breadcrumb-item";
					btn.dataset.path = currentPath;
					btn.textContent = part;
					btn.addEventListener("click", () => navigateToFolder(currentPath));
					breadcrumbsContainer.appendChild(btn);

					if (index < parts.length - 1) {
						const sep = document.createElement("span");
						sep.className = "breadcrumb-separator";
						sep.textContent = "/";
						breadcrumbsContainer.appendChild(sep);
					}
				});
			};

			const navigateToFolder = (prefix) => {
				currentPrefix = prefix;
				searchInput.value = "";
				renderBreadcrumbs(prefix);
				loadObjects();
			};

			const renderObjects = (objects, folders = []) => {
				grid.innerHTML = "";

				const totalItems = folders.length + objects.length;

				if (!totalItems) {
					grid.style.display = "none";
					emptyState.hidden = false;
					return;
				}

				grid.style.display = "grid";
				emptyState.hidden = true;

				let index = 0;

				// Render folders first
				folders.forEach((folderName) => {
					const card = document.createElement("article");
					card.className = "object-card folder-card";
					card.style.animationDelay = \`\${index * 30}ms\`;

					card.innerHTML = \`
						<div class="card-header">
							<div class="file-icon">
								\${getFolderIcon()}
							</div>
							<h3 title="\${folderName}">\${folderName.replace(/\\/$/g, '')}</h3>
						</div>
						<div class="meta-grid">
							<div class="meta-item">
								<div class="meta-label">Type</div>
								<div class="meta-value">Folder</div>
							</div>
							<div class="meta-item">
								<div class="meta-label">Items</div>
								<div class="meta-value">—</div>
							</div>
						</div>
						<button class="download-folder-btn" data-folder="\${folderName}">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="7 10 12 15 17 10"></polyline>
								<line x1="12" y1="15" x2="12" y2="3"></line>
							</svg>
							Download Folder
						</button>
					\`;

					// Navigate to folder on card click (but not on button click)
					card.addEventListener("click", (e) => {
						if (!e.target.closest('.download-folder-btn')) {
							navigateToFolder(currentPrefix + folderName);
						}
					});

					// Download folder on button click
					const downloadBtn = card.querySelector('.download-folder-btn');
					downloadBtn.addEventListener("click", (e) => {
						e.stopPropagation();
						downloadFolder(currentPrefix + folderName);
					});

					grid.append(card);
					index++;
				});

				// Render files
				objects.forEach((object) => {
					const card = document.createElement("article");
					card.className = "object-card";
					card.style.animationDelay = \`\${index * 30}ms\`;

					const displayName = object.key.replace(currentPrefix, "");

					card.innerHTML = \`
						<div class="card-header">
							<div class="file-icon">
								\${getFileIcon()}
							</div>
							<h3 title="\${object.key}">\${displayName}</h3>
						</div>
						<div class="meta-grid">
							<div class="meta-item">
								<div class="meta-label">Size</div>
								<div class="meta-value">\${formatBytes(object.size)}</div>
							</div>
							<div class="meta-item">
								<div class="meta-label">Modified</div>
								<div class="meta-value">\${formatDate(object.uploaded)}</div>
							</div>
						</div>
						<div class="card-footer">
							<a href="/api/objects/\${encodeURIComponent(object.key)}?download=1" class="download-link" onclick="event.stopPropagation()">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
									<polyline points="7 10 12 15 17 10"></polyline>
									<line x1="12" y1="15" x2="12" y2="3"></line>
								</svg>
								Download
							</a>
							<div class="badge">
								\${object.etag ? object.etag.replace(/"/g, "").slice(0, 8) : "no-etag"}
							</div>
						</div>
					\`;

					grid.append(card);
					index++;
				});
			};

			const filterObjects = (query) => {
				const lowerQuery = query.toLowerCase().trim();

				let filteredFolders = allFolders;

				if (!lowerQuery) {
					filteredObjects = [...allObjects];
				} else {
					filteredFolders = allFolders.filter(folder =>
						folder.toLowerCase().includes(lowerQuery)
					);
					filteredObjects = allObjects.filter(obj =>
						obj.key.replace(currentPrefix, "").toLowerCase().includes(lowerQuery)
					);
				}

				renderObjects(filteredObjects, filteredFolders);
				updateStatus();
			};

			const updateStatus = () => {
				const objectCount = filteredObjects.length;
				const folderCount = allFolders.length;
				const totalCount = objectCount + folderCount;
				const total = allObjects.length + allFolders.length;

				if (searchInput.value.trim() && totalCount !== total) {
					statusText.textContent = \`\${totalCount} of \${total} items\`;
				} else {
					const parts = [];
					if (folderCount > 0) parts.push(\`\${folderCount} folder\${folderCount !== 1 ? 's' : ''}\`);
					if (objectCount > 0) parts.push(\`\${objectCount} file\${objectCount !== 1 ? 's' : ''}\`);
					statusText.textContent = parts.length ? parts.join(", ") : "No items";
				}
			};

			const loadObjects = async () => {
				skeletonLoader.style.display = "grid";
				grid.style.display = "none";
				emptyState.hidden = true;

				status.dataset.state = "loading";
				statusText.textContent = "Syncing...";

				try {
					const url = new URL("/api/objects", window.location.href);
					if (currentPrefix) {
						url.searchParams.set("prefix", currentPrefix);
					}

					const response = await fetch(url);
					if (!response.ok) {
						throw new Error("Failed to fetch objects");
					}

					const data = await response.json();

					// Get folders from delimitedPrefixes
					allFolders = (data.delimitedPrefixes ?? []).map(prefix => {
						// Remove the currentPrefix to get just the folder name
						return prefix.replace(currentPrefix, "");
					});

					// Filter objects to only show those in the current directory
					allObjects = (data.objects ?? []).filter(obj => {
						const relativePath = obj.key.replace(currentPrefix, "");
						// Only include files in current directory (no nested folders)
						return !relativePath.includes("/");
					});

					filteredObjects = [...allObjects];

					setTimeout(() => {
						skeletonLoader.style.display = "none";
						renderObjects(filteredObjects, allFolders);
						status.dataset.state = "ready";
						updateStatus();
					}, 300);
				} catch (error) {
					console.error(error);
					skeletonLoader.style.display = "none";
					status.dataset.state = "error";
					statusText.textContent = "Sync failed";
					emptyState.hidden = false;
				}
			};

			refreshButton.addEventListener("click", () => {
				searchInput.value = "";
				currentPrefix = "";
				renderBreadcrumbs("");
				loadObjects();
			});

			searchInput.addEventListener("input", (e) => {
				filterObjects(e.target.value);
			});

			// Download folder functionality
			const progressModal = document.getElementById("progress-modal");
			const progressBar = document.getElementById("progress-bar");
			const progressLabel = document.getElementById("progress-label");
			const progressStats = document.getElementById("progress-stats");
			const modalClose = document.getElementById("modal-close");

			let downloadAborted = false;

			modalClose.addEventListener("click", () => {
				downloadAborted = true;
				progressModal.style.display = "none";
			});

			const downloadFolder = async (folderPrefix) => {
				downloadAborted = false;
				progressModal.style.display = "flex";
				progressBar.style.width = "0%";
				progressLabel.textContent = "Fetching file list...";
				progressStats.textContent = "Please wait...";

				try {
					// Get all files in the folder recursively
					const allFiles = await getAllFilesInFolder(folderPrefix);

					if (downloadAborted) return;

					if (allFiles.length === 0) {
						progressLabel.textContent = "Folder is empty";
						progressStats.textContent = "No files to download";
						setTimeout(() => {
							progressModal.style.display = "none";
						}, 2000);
						return;
					}

					progressLabel.textContent = \`Downloading \${allFiles.length} files...\`;
					progressStats.textContent = \`0 / \${allFiles.length} files\`;

					// Create ZIP
					const zip = new JSZip();
					const folderName = folderPrefix.split("/").filter(Boolean).pop() || "bucket";

					// Download and add files to ZIP
					for (let i = 0; i < allFiles.length; i++) {
						if (downloadAborted) return;

						const file = allFiles[i];
						progressLabel.textContent = \`Downloading: \${file.key}\`;
						progressStats.textContent = \`\${i + 1} / \${allFiles.length} files\`;
						progressBar.style.width = \`\${((i + 1) / allFiles.length) * 100}%\`;

						try {
							const response = await fetch(\`/api/objects/\${encodeURIComponent(file.key)}\`);
							if (!response.ok) throw new Error(\`Failed to download \${file.key}\`);

							const blob = await response.blob();
							const relativePath = file.key.replace(folderPrefix, "");
							zip.file(relativePath, blob);
						} catch (error) {
							console.error(\`Error downloading \${file.key}:\`, error);
						}
					}

					if (downloadAborted) return;

					// Generate and download ZIP
					progressLabel.textContent = "Creating ZIP file...";
					progressStats.textContent = "Almost done...";

					const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
						const percent = metadata.percent.toFixed(0);
						progressBar.style.width = \`\${percent}%\`;
					});

					if (downloadAborted) return;

					// Trigger download
					const url = URL.createObjectURL(zipBlob);
					const a = document.createElement("a");
					a.href = url;
					a.download = \`\${folderName}.zip\`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

					progressLabel.textContent = "Download complete!";
					progressStats.textContent = \`\${allFiles.length} files downloaded\`;
					progressBar.style.width = "100%";

					setTimeout(() => {
						progressModal.style.display = "none";
					}, 2000);
				} catch (error) {
					console.error("Error downloading folder:", error);
					progressLabel.textContent = "Download failed";
					progressStats.textContent = error.message || "An error occurred";
					setTimeout(() => {
						progressModal.style.display = "none";
					}, 3000);
				}
			};

			const getAllFilesInFolder = async (prefix) => {
				const files = [];
				let cursor = undefined;
				let truncated = true;

				while (truncated) {
					const url = new URL("/api/objects", window.location.href);
					url.searchParams.set("prefix", prefix);
					if (cursor) {
						url.searchParams.set("cursor", cursor);
					}

					const response = await fetch(url);
					if (!response.ok) throw new Error("Failed to fetch file list");

					const data = await response.json();

					// Add all objects (files only, not folders)
					if (data.objects) {
						files.push(...data.objects);
					}

					cursor = data.cursor;
					truncated = data.truncated;
				}

				return files;
			};

			// Mouse tracking for panel hover effect
			document.querySelectorAll('.panel').forEach(panel => {
				panel.addEventListener('mousemove', (e) => {
					const rect = panel.getBoundingClientRect();
					const x = ((e.clientX - rect.left) / rect.width) * 100;
					const y = ((e.clientY - rect.top) / rect.height) * 100;
					panel.style.setProperty('--mouse-x', \`\${x}%\`);
					panel.style.setProperty('--mouse-y', \`\${y}%\`);
				});
			});

			loadObjects();
		</script>
	</body>
</html>
`.trim();
};
