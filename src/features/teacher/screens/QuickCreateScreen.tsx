import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { teacherApi, ClassSection, Subject } from "../api/teacherApi";

type PostType = "homework" | "announcement";

export const QuickCreateScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const [postType, setPostType] = useState<PostType>(params.type === "announcement" ? "announcement" : "homework");

  const [sections, setSections] = useState<ClassSection[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notify, setNotify] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    // mine: true — this screen posts homework/announcements as this
    // teacher, so the chip list (and its default selection) must be scoped
    // to classes they're actually assigned to, unlike the dashboard's
    // optional "view all classes" toggle for Head Masters. Omitting this
    // param let the default selection land on a class outside the
    // teacher's own assignment, which silently 403'd the (real,
    // ownership-checked) Homework post.
    teacherApi
      .getMyClassSections({ mine: true })
      .then((data) => {
        setSections(data);
        if (data[0]) setSelectedIds([data[0].id]);
      })
      .catch((err) => console.error("Failed to load class sections:", err));
    // No "my subjects" endpoint exists — /api/subjects/ is the whole
    // school's list, not scoped to this teacher, so there's no safe default
    // to guess here (unlike class_sections above). Leave unselected and
    // require an explicit pick; the ownership check server-side rejects
    // the wrong subject anyway, but a silent wrong default is worse UX
    // than an empty required field.
    teacherApi.getSubjects().then(setSubjects).catch((err) => console.error("Failed to load subjects:", err));
  }, []);

  const toggleSection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please add a title before publishing.");
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert("Pick a class", "Select at least one class-section.");
      return;
    }

    if (postType === "homework" && !dueDate.trim()) {
      Alert.alert("Due date required", "Please add a due date for this homework.");
      return;
    }
    if (postType === "homework" && !selectedSubjectId) {
      Alert.alert("Pick a subject", "Select which subject this homework is for.");
      return;
    }

    setPublishing(true);
    try {
      if (postType === "homework") {
        await teacherApi.postHomework({
          title: title.trim(),
          details: details.trim(),
          class_sections: selectedIds,
          subject: selectedSubjectId as number,
          due_date: dueDate.trim(),
        });
        Alert.alert("Posted", "Homework has been posted.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        await teacherApi.postAnnouncement({
          title: title.trim(),
          body: details.trim(),
          class_sections: selectedIds,
          category: "announcement",
          due_date: dueDate || null,
          notify,
        });
        Alert.alert("Published", "Your announcement has been posted.", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (err: any) {
      Alert.alert("Couldn't publish", err.message || "Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post</Text>
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={publishing}>
          {publishing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishBtnText}>Publish</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segment, postType === "homework" && styles.segmentOn]}
            onPress={() => setPostType("homework")}
          >
            <Text style={[styles.segmentText, postType === "homework" && styles.segmentTextOn]}>Homework</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, postType === "announcement" && styles.segmentOn]}
            onPress={() => setPostType("announcement")}
          >
            <Text style={[styles.segmentText, postType === "announcement" && styles.segmentTextOn]}>Announcement</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={styles.label}>CLASS &amp; SUBJECT</Text>
          <View style={styles.chipRow}>
            {sections.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selectedIds.includes(s.id) && styles.chipOn]}
                onPress={() => toggleSection(s.id)}
              >
                <Text style={[styles.chipText, selectedIds.includes(s.id) && styles.chipTextOn]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {postType === "homework" && (
          <View>
            <Text style={styles.label}>SUBJECT</Text>
            <View style={styles.chipRow}>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, selectedSubjectId === s.id && styles.chipOn]}
                  onPress={() => setSelectedSubjectId(s.id)}
                >
                  <Text style={[styles.chipText, selectedSubjectId === s.id && styles.chipTextOn]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.titleInput}
            placeholder={postType === "homework" ? "Exercise 5.3 — Decimals practice" : "Parent-Teacher Meeting"}
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View>
          <Text style={styles.label}>DETAILS</Text>
          <TextInput
            style={styles.detailsInput}
            placeholder="Add details for parents/students…"
            placeholderTextColor={COLORS.textMuted}
            value={details}
            onChangeText={setDetails}
            multiline
          />
        </View>

        {postType === "homework" && (
          <View>
            <Text style={styles.label}>DUE DATE</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g. 2026-07-16"
              placeholderTextColor={COLORS.textMuted}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        )}

        <TouchableOpacity style={styles.notifyRow} onPress={() => setNotify((n) => !n)}>
          <View style={[styles.toggleTrack, notify && styles.toggleTrackOn]}>
            <View style={[styles.toggleThumb, notify && styles.toggleThumbOn]} />
          </View>
          <Text style={styles.notifyText}>
            <Text style={styles.bold}>Notify parents</Text> — a push notification goes to all linked parents of the
            selected class(es).
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  closeBtn: { fontSize: 18, color: COLORS.text },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: COLORS.text },
  publishBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  publishBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40, gap: 18 },
  segmented: { flexDirection: "row", backgroundColor: COLORS.surfaceDark, borderRadius: 14, padding: 4 },
  segment: { flex: 1, borderRadius: 11, paddingVertical: 10, alignItems: "center" },
  segmentOn: { backgroundColor: COLORS.surface },
  segmentText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  segmentTextOn: { color: COLORS.primaryDark, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, letterSpacing: 0.4, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8 },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12.5, fontWeight: "600", color: COLORS.textSecondary },
  chipTextOn: { color: "#fff" },
  titleInput: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 16,
    padding: 14, fontSize: 14.5, fontWeight: "600", color: COLORS.text,
  },
  detailsInput: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
    padding: 14, fontSize: 13.5, color: COLORS.text, minHeight: 96, textAlignVertical: "top",
  },
  notifyRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14 },
  toggleTrack: { width: 44, height: 26, borderRadius: 14, backgroundColor: COLORS.border },
  toggleTrackOn: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", margin: 3 },
  toggleThumbOn: { alignSelf: "flex-end" },
  notifyText: { flex: 1, fontSize: 12.5, color: "#5B21B6", lineHeight: 18 },
  bold: { fontWeight: "700" },
});

export default QuickCreateScreen;
