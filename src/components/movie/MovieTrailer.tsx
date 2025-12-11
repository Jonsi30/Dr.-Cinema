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
        // If this is a wrapper with a `results` array (TMDB style), pick the best
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
                // sort descending by heuristic score
                ytResults.sort((a: any, b: any) => scoreEntry(b) - scoreEntry(a));
                const best = ytResults[0];
                console.warn("Selected best YouTube trailer entry:", best);
                if (best.url && typeof best.url === "string") return best.url;
                if (best.key && typeof best.key === "string") return `https://www.youtube.com/watch?v=${best.key}`;
                if (best.embed && typeof best.embed === "string") return best.embed;
            }

            // Fallback: prefer any entry that already has a usable URL
            for (const entry of results) {
                if (entry?.url && typeof entry.url === "string") return entry.url;
            }

            // Last resort: try to construct from any YouTube key in results
            for (const entry of results) {
                if (entry?.key && typeof entry.key === "string") return `https://www.youtube.com/watch?v=${entry.key}`;
            }
        }

        const candidates = [
            "url",
            "video",
            "videoUrl",
            "src",
            "link",
            "href",
            "embed",
            "key",
        ];

        for (const k of candidates) {
            const v = t[k];
            if (!v) continue;
            if (typeof v === "string" && v.trim()) {
                // if it's a plain YouTube key (e.g. 'abc123'), build a watch url
                if (k === "key") return `https://www.youtube.com/watch?v=${v.trim()}`;
                return v.trim();
            }
            if (v && typeof v === "object") {
                // nested shape like { url: '...' } or { href: '...' }
                for (const nk of ["url", "href", "src"]) {
                    if (typeof v[nk] === "string" && v[nk].trim()) return v[nk].trim();
                }
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

    const isYouTube = (url?: string) => {
        if (!url) return false;
        return /youtube\.com|youtu\.be/.test(url);
    };

    const getYouTubeId = (url: string): string | null => {
        try {
            // plain watch url
            const m = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
            if (m && m[1]) return m[1];
            // youtu.be short link
            const m2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
            if (m2 && m2[1]) return m2[1];
            // embed url
            const m3 = url.match(/embed\/([a-zA-Z0-9_-]{6,})/);
            if (m3 && m3[1]) return m3[1];
            // fallback: last path segment if it looks like an id
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
            const appUrl = id ? `vnd.youtube://watch?v=${id}` : undefined;

            if (appUrl) {
                try {
                    await Linking.openURL(appUrl);
                    return;
                } catch {
                    // couldn't open YouTube app, fall back
                }
            }

            try {
                await WebBrowser.openBrowserAsync(watchUrl);
                return;
            } catch {
                // try external Linking
                try {
                    await Linking.openURL(watchUrl);
                    return;
                } catch {
                    console.warn("Failed to open YouTube trailer");
                    alert("Unable to open trailer");
                }
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
        console.warn("Trailer press, resolved url:", url, "trailer:", trailer);
        if (!url) {
            alert("Trailer URL not available");
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

            {isYouTube(resolvedUrl) ? (
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
            ) : (
                <Text style={styles.watchButton} onPress={() => handleOpenInBrowser(resolvedUrl)}>
                    Watch Trailer
                </Text>
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
