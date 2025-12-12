import * as ExpoVideo from "expo-video";
import * as WebBrowser from "expo-web-browser";
import React, { useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";
import { Trailer } from "../../types/types";

// Resolve the correct Video component: prefer expo-video exports, fall back to expo-av
const VideoComponent: any = (ExpoVideo as any)?.Video || (ExpoVideo as any)?.default || null;

interface MovieTrailerProps {
    trailers?: Trailer[];
}

export const MovieTrailer: React.FC<MovieTrailerProps> = ({ trailers }) => {
    const videoRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    if (!trailers || trailers.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.label}>Trailer</Text>
                <Text style={styles.emptyState}>
                    No trailer available for this movie
                </Text>
            </View>
        );
    }

    const trailer = trailers[0];

    const getTrailerUrl = (t: any): string | undefined => {
        if (!t) return undefined;
        if (Array.isArray(t.results) && t.results.length > 0) {
            const results = t.results.filter(Boolean);

            // Prefer YouTube-hosted entries when possible
            const ytResults = results.filter((r: any) => r && r.site && /youtube/i.test(r.site));

            const scoreEntry = (e: any) => {
                let score = 0;
                if (!e) return score;
                if (e.type && /trailer/i.test(e.type)) score += 100;
                if (e.official === true) score += 50;
                if (e.name && /official/i.test(e.name)) score += 30;
                if (e.name && /trailer/i.test(e.name)) score += 10;
                if (e.published_at || e.publishedAt || e.published_at) score += 1;
                return score;
            };

            if (ytResults.length > 0) {
                ytResults.sort((a: any, b: any) => scoreEntry(b) - scoreEntry(a));
                const best = ytResults[0];
                if (best.key && typeof best.key === "string") {
                    return `https://www.youtube.com/watch?v=${best.key}`;
                }

                // If the API already provided a URL, attempt to convert embed links to watch URLs
                if (best.url && typeof best.url === "string") {
                    // Try to extract a youtube id from the provided url and convert to watch URL
                    const maybeId = getYouTubeId(best.url as string);
                    if (maybeId) return `https://www.youtube.com/watch?v=${maybeId}`;
                    return best.url;
                }

                // Last fallback: embed field (may be an iframe src)
                if (best.embed && typeof best.embed === "string") {
                    const maybeId = getYouTubeId(best.embed as string);
                    if (maybeId) return `https://www.youtube.com/watch?v=${maybeId}`;
                    return best.embed;
                }
            }

            // Fallback: prefer any entry that already has a usable URL
            for (const entry of results) {
                if (entry?.url && typeof entry.url === "string") return entry.url;
            }
        }

        const keys = Object.keys(t || {});
        for (const k of keys) {
            try {
                const v = (t as any)[k];
                if (!v) continue;

                if (typeof v === "string" && v.trim()) {
                    const trimmed = v.trim();
                    // if it's a plain YouTube key (e.g. 'abc123'), build a watch url
                    if (k === "key") {
                        console.warn("Resolved trailer key from property:", k);
                        return `https://www.youtube.com/watch?v=${trimmed}`;
                    }
                    console.warn("Resolved trailer url from property:", k);
                    return trimmed;
                }

                if (v && typeof v === "object") {
                    // nested shape like { url: '...' } or { href: '...' }
                    for (const nk of ["url", "href", "src"]) {
                        if (typeof v[nk] === "string" && v[nk].trim()) {
                            console.warn("Resolved trailer url from nested property:", `${k}.${nk}`);
                            return v[nk].trim();
                        }
                    }
                }
            } catch {
                // ignore and continue searching other keys
            }
        }

        // If there is a files array with an item containing a url
        if (Array.isArray(t.files)) {
            for (const f of t.files) {
                if (f?.url && typeof f.url === "string") return f.url;
                if (f?.src && typeof f.src === "string") return f.src;
            }
        }

        return undefined;
    };

    const resolvedUrl = getTrailerUrl(trailer as any);
    if (!resolvedUrl) {
        console.warn("Trailer resolver returned no URL for trailer object:", trailer);
    }

    const isYouTube = (url?: string) => {
        if (!url) return false;
        return /youtube\.com|youtu\.be/.test(url);
    };

    const getYouTubeId = (url: string): string | null => {
        try {
            // Try using the URL API first for robustness
            try {
                const u = new URL(url);
                // watch?v=ID
                if (u.searchParams && u.searchParams.get("v")) return u.searchParams.get("v");
                // youtu.be short links produce hostname youtu.be and path /ID
                if (/youtu\.be$/i.test(u.hostname)) {
                    const p = u.pathname.replace(/^\//, "");
                    if (/^[a-zA-Z0-9_-]{6,}$/.test(p)) return p;
                }
                // embed path like /embed/ID
                const embedMatch = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
                if (embedMatch && embedMatch[1]) return embedMatch[1];
            } catch {
                // URL parsing may fail for non-URL strings; fall back to regex
            }

            // regex fallbacks for various YouTube URL shapes (IDs are typically 11 chars but accept 6+)
            const m = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
            if (m && m[1]) return m[1];
            const m2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
            if (m2 && m2[1]) return m2[1];
            const m3 = url.match(/embed\/([a-zA-Z0-9_-]{6,})/);
            if (m3 && m3[1]) return m3[1];

            // last resort: last path segment
            const parts = url.split("/").filter(Boolean);
            const last = parts[parts.length - 1];
            if (last && /^[a-zA-Z0-9_-]{6,}$/.test(last)) return last;
        } catch {
            // ignore
        }
        return null;
    };

    const handleOpenInBrowser = async (url?: string) => {
        if (!url) {
            console.warn("handleOpenInBrowser called with empty url", url, trailer);
            return;
        }

        // If this looks like a YouTube link, try to open in the YouTube app first,
        // then fall back to the browser (WebBrowser then Linking as last resort).
        if (isYouTube(url)) {
            const id = getYouTubeId(url);
            const watchUrl = id ? `https://www.youtube.com/watch?v=${id}` : url;
            // Try a few known app URL schemes (some platforms support youtube://, vnd.youtube://)
            const appSchemes = id ? [`vnd.youtube://watch?v=${id}`, `youtube://watch?v=${id}`] : [];
            for (const scheme of appSchemes) {
                try {
                    await Linking.openURL(scheme);
                    return;
                } catch {
                    // ignore and try next
                }
            }

            // Try in-app browser, then external Linking
            try {
                const res = await WebBrowser.openBrowserAsync(watchUrl);
                if (res) return;
            } catch {
                // ignore and try Linking.openURL below
            }

            try {
                await Linking.openURL(watchUrl);
                return;
            } catch {
                console.warn("Failed to open YouTube trailer via Linking");
                try {
                    alert(`Unable to open trailer: ${watchUrl}`);
                } catch {}
            }

            return;
        }

        // Non-YouTube: try browser first
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch (err) {
            console.warn("Failed to open browser for trailer:", err);
            Linking.openURL(url).catch(() => alert("Unable to open trailer"));
        }
    };

    const handlePress = () => {
        const url = resolvedUrl;
        if (!url) {
            alert("No trailer available for this movie");
            return;
        }

        if (isYouTube(url)) {
            handleOpenInBrowser(url);
            return;
        }

        // For direct video links, toggle playback (if inline player available)
        if (VideoComponent) {
            setIsPlaying((p) => !p);
            return;
        }

        // Fallback: open the trailer in the browser
        handleOpenInBrowser(url);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Trailer</Text>

            {resolvedUrl && isYouTube(resolvedUrl) ? (
                <Text style={styles.watchButton} onPress={handlePress}>
                    Watch Trailer
                </Text>
            ) : resolvedUrl && VideoComponent ? (
                <View>
                    <VideoComponent
                        ref={(r: any) => { videoRef.current = r; }}
                        source={{ uri: resolvedUrl }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                        shouldPlay={isPlaying}
                        onError={(e: any) => console.warn("Video playback error:", e)}
                    />
                    <Text style={styles.watchButton} onPress={handlePress}>
                        {isPlaying ? "Pause" : "Play"}
                    </Text>
                </View>
            ) : resolvedUrl ? (
                <Text style={styles.watchButton} onPress={() => handleOpenInBrowser(resolvedUrl)}>
                    Watch Trailer
                </Text>
            ) : (
                <Text style={styles.emptyState}>Trailer URL not available</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    label: {
        fontSize: FONT_SIZES.medium,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    emptyState: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        fontStyle: "italic",
    },
    watchButton: {
        fontSize: FONT_SIZES.medium,
        color: COLORS.primary,
        fontWeight: "600",
    },
    video: {
        width: "100%",
        height: 220,
        borderRadius: 8,
        backgroundColor: COLORS.border,
        marginTop: SPACING.sm,
    },
    // removed inline webplayer styles
});
