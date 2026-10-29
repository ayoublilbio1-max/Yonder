import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { CallModal, type CallKind } from '../../chat/CallModal';
import { ChatOptions } from '../../chat/ChatOptions';
import { chatTime, useChats, type ChatMedia, type ChatMessage } from '../../chat/ChatProvider';
import { pickFromGallery, takePhoto } from '../../chat/media';
import { AudioBubble, FullMedia, PhotoBubble, TimedPhotoBubble, VideoBubble, VoiceRecorder } from '../../chat/MediaBubbles';
import { PhotoPreview } from '../../chat/PhotoPreview';
import { fonts } from '../../constants/fonts';
import { MediaViewer } from '../../deck/MediaViewer';
import { ProfileCard } from '../../deck/ProfileCard';
import { ProfileSections } from '../../deck/ProfileSections';
import { ReportSheet } from '../../deck/ReportSheet';
import { useSwipe } from '../../deck/SwipeProvider';
import { mainPhotoUri } from '../../profiles/data';
import { isLocked } from '../../profiles/extras';
import type { Profile } from '../../profiles/types';
import { useTheme } from '../../theme/ThemeProvider';
import { locale, tr } from '../../i18n/i18n';

// A match's page (like Muzz): top bar (back · photo · name · audio · video · ⋮) and a
// Chat / Profile switch. Chat = the messages; Profile = their card + all the sections + Unmatch.
// ⋮ opens "Chat options": calls, share, search, export, unmatch, block, report.
// Input: gallery (photo / video) · text · camera (take a photo) · mic (voice message) — all real files.

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const MAX = 500;

type IconName = ComponentProps<typeof Ionicons>['name'];
type Tab = 'chat' | 'profile';
type Confirm = 'unmatch' | 'block' | null;

export default function ChatScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { threads, typing, profileFor, send, sendMedia, requestPhotos, setActive, removeThread, markOpened, toggleHeart } = useChats();
  const { me, saved, toggleFavorite, unmatch } = useSwipe();

  const [tab, setTab] = useState<Tab>('chat');
  const [text, setText] = useState('');
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [call, setCall] = useState<CallKind | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [reporting, setReporting] = useState(false);
  const [search, setSearch] = useState<string | null>(null); // null = not searching
  const [recording, setRecording] = useState(false);
  const [fullMedia, setFullMedia] = useState<ChatMedia | null>(null);
  const [picking, setPicking] = useState(false); // gallery / camera open: ignore double taps
  const [preview, setPreview] = useState<ChatMedia | null>(null); // photo waiting for a timer choice

  const profile = id ? profileFor(id) : null;
  const thread = id ? threads[id] : undefined;
  const messages = thread?.messages ?? [];
  const locked = profile ? isLocked(profile) : false;
  const isTyping = id ? Boolean(typing[id]) : false;

  // This chat is on screen: its new messages are read.
  useEffect(() => {
    if (!id) return;
    setActive(id);
    if (__DEV__) console.log(`[chat] screen ${id}`);
    return () => setActive(null);
  }, [id, setActive]);

  if (!profile || !id) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}>
        <AppText variant="body" muted>
          {tr('This chat isn’t available.')}
        </AppText>
      </View>
    );
  }

  const him = profile.gender === 'male';

  const onSend = () => {
    if (!text.trim()) return;
    send(id, text);
    setText('');
  };

  const pick = async (from: 'gallery' | 'camera') => {
    if (picking) return;
    setPicking(true);
    const res = from === 'gallery' ? await pickFromGallery() : await takePhoto(id);
    setPicking(false);
    if (res.ok && res.media.kind === 'photo') setPreview(res.media); // choose a timer first
    else if (res.ok) sendMedia(id, res.media);
    else if (res.reason === 'denied') toast.show(tr('Allow the camera to take a photo'));
    else if (res.reason === 'error') toast.show(tr('Couldn’t add that file'));
  };

  // Tap on a photo / video in the chat. Timed photos: theirs open once, yours can't be opened.
  const openMessageMedia = (msg: ChatMessage) => {
    const media = msg.media;
    if (!media) return;
    if (!media.timer) {
      setFullMedia(media);
      return;
    }
    if (msg.from === 'me') {
      toast.show(media.opened ? tr('{name} opened your photo', { name: profile.name }) : tr('Photos with a timer can’t be opened by the sender'));
      return;
    }
    if (media.opened) {
      toast.show(tr('This photo was already opened'));
      return;
    }
    markOpened(id, msg.id);
    setFullMedia(media);
  };

  const openPhotos = () => {
    if (locked) {
      toast.show(him ? tr('{name} hasn’t shared his photos yet', { name: profile.name }) : tr('{name} hasn’t shared her photos yet', { name: profile.name }));
      return;
    }
    setViewing(profile);
  };

  const share = async () => {
    try {
      const res = await Share.share({ message: tr('Check out {name}, {age} on Yonder (demo profile).', { name: profile.name, age: profile.age }) });
      if (__DEV__) console.log(`[chat] share ${id} → ${res.action}`);
    } catch (e) {
      if (__DEV__) console.log('[chat] share failed', String(e));
    }
  };

  // Export: a text file with the whole chat, then the phone's share menu (save, email, WhatsApp…).
  const exportChat = async () => {
    const lines = messages.map((m) => {
      const who = m.from === 'me' ? me.firstName || tr('Me') : m.from === 'them' ? profile.name : '—';
      return `[${new Date(m.at).toLocaleString(locale())}] ${who}: ${m.media ? `[${m.text}]` : m.text}`;
    });
    const body = [
      tr('Yonder chat with {name}', { name: profile.fullName }),
      tr('Exported {date}', { date: new Date().toLocaleString(locale()) }),
      '',
      ...lines,
    ].join('\n');
    try {
      const file = new File(Paths.cache, `Yonder chat - ${profile.name}.txt`);
      if (file.exists) file.delete();
      file.create();
      file.write(body);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: tr('Chat with {name}', { name: profile.name }) });
      } else {
        await Share.share({ message: body });
      }
      if (__DEV__) console.log(`[chat] exported ${id} · ${messages.length} messages`);
    } catch (e) {
      if (__DEV__) console.log('[chat] export failed', String(e));
      toast.show(tr('Couldn’t export the chat'));
    }
  };

  // Unmatch / block / report: the match and the chat are removed, they never show again.
  const leave = (reason: string, message: string) => {
    unmatch(id, reason);
    removeThread(id);
    toast.show(message);
    router.back();
  };

  const results =
    search && search.trim()
      ? messages.filter((m) => m.from !== 'system' && !m.media && m.text.toLowerCase().includes(search.trim().toLowerCase()))
      : null;
  const data = [...(results ?? messages)].reverse(); // inverted list: newest first

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* ---------- top bar ---------- */}
      <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: colors.bg }]}>
        <HeaderIcon icon="arrow-back" label={tr('Back')} onPress={() => router.back()} />
        {search !== null ? (
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={tr('Search this chat')}
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              autoFocus
              style={[styles.searchInput, { color: colors.text, fontFamily: fonts.regular }]}
            />
            <Pressable onPress={() => setSearch(null)} accessibilityRole="button" accessibilityLabel="Close search" hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable onPress={() => setTab('profile')} accessibilityRole="button" style={styles.headerWho}>
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                <Image
                  source={{ uri: mainPhotoUri(profile) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  blurRadius={locked ? 30 : 0}
                  transition={200}
                />
              </View>
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <AppText variant="body" weight="semibold" numberOfLines={1} style={styles.shrink}>
                    {profile.name}
                  </AppText>
                  {profile.verified ? <Ionicons name="checkmark-circle" size={16} color={colors.verified} /> : null}
                </View>
                <AppText variant="caption" color={isTyping ? colors.primary : colors.textMuted} numberOfLines={1}>
                  {isTyping ? tr('typing…') : profile.verified ? tr('Verified') : tr('Not verified')}
                </AppText>
              </View>
            </Pressable>
            <HeaderIcon icon="call-outline" label={tr('Audio call')} onPress={() => setCall('audio')} />
            <HeaderIcon icon="videocam-outline" label={tr('Video call')} onPress={() => setCall('video')} />
            <HeaderIcon icon="ellipsis-vertical" label={tr('Chat options')} onPress={() => setOptionsOpen(true)} />
          </>
        )}
      </View>

      {search === null ? <Switch tab={tab} onChange={setTab} /> : null}

      {search !== null && results ? (
        <AppText variant="caption" muted style={styles.resultCount}>
          {results.length === 1 ? tr('1 message found') : tr('{count} messages found', { count: results.length })}
        </AppText>
      ) : null}

      {/* ---------- Chat ---------- */}
      {tab === 'chat' || search !== null ? (
        <>
          {locked && search === null ? (
            <View style={[styles.lockBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
              <AppText variant="caption" muted style={styles.flex}>
                {tr('{name}’s photos are private. They’re shared as you get to know each other.', { name: profile.name })}
              </AppText>
              <Pressable
                onPress={() => requestPhotos(id)}
                disabled={thread?.requested}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.requestBtn,
                  { backgroundColor: colors.primary, opacity: thread?.requested ? 0.5 : pressed ? 0.85 : 1 },
                ]}
              >
                <AppText variant="caption" weight="bold" color={colors.onPrimary}>
                  {thread?.requested ? tr('Requested') : tr('Request photos')}
                </AppText>
              </Pressable>
            </View>
          ) : null}

          <KeyboardAvoidingView behavior="padding" style={styles.flex}>
            <FlatList
              data={data}
              inverted
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.messages}
              ListHeaderComponent={isTyping && search === null ? <TypingBubble /> : undefined}
              ListFooterComponent={
                search === null ? (
                  <View style={styles.matchNote}>
                    <AppText variant="caption" muted align="center">
                      {tr('You matched with {name}. Say hi 👋', { name: profile.name })}
                    </AppText>
                  </View>
                ) : undefined
              }
              renderItem={({ item, index }) => (
                <Bubble msg={item} newer={data[index - 1]} onOpenMedia={openMessageMedia} onHeart={(m) => toggleHeart(id, m.id)} />
              )}
            />

            {search === null ? (
              <View
                style={[
                  styles.inputBar,
                  { borderTopColor: colors.border, backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 10) },
                ]}
              >
                {recording ? (
                  <VoiceRecorder
                    onError={(m) => toast.show(m)}
                    onDone={(media) => {
                      setRecording(false);
                      if (media) sendMedia(id, media);
                    }}
                  />
                ) : (
                  <>
                    <InputIcon icon="images-outline" label={tr('Send a photo or video')} onPress={() => pick('gallery')} />
                    <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <TextInput
                        value={text}
                        onChangeText={(t) => setText(t.slice(0, MAX))}
                        placeholder={tr('Type a message…')}
                        placeholderTextColor={colors.textSubtle}
                        selectionColor={colors.primary}
                        cursorColor={colors.primary}
                        multiline
                        style={[styles.input, { color: colors.text, fontFamily: fonts.regular }]}
                      />
                    </View>
                    {text.trim().length > 0 ? (
                      <SendButton enabled onPress={onSend} />
                    ) : (
                      <>
                        <InputIcon icon="camera-outline" label={tr('Take a photo')} onPress={() => pick('camera')} />
                        <InputIcon icon="mic-outline" label={tr('Record a voice message')} onPress={() => setRecording(true)} />
                      </>
                    )}
                  </>
                )}
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </>
      ) : (
        /* ---------- Profile ---------- */
        <Animated.View entering={FadeIn.duration(220)} style={styles.flex}>
          <ScrollView contentContainerStyle={[styles.profileContent, { paddingBottom: insets.bottom + 24 }]}>
            <ProfileCard profile={profile} height={Math.round(height * 0.58)} onOpen={openPhotos} />
            <ProfileSections
              profile={profile}
              me={me}
              isFavorite={saved.favorites.includes(id)}
              onFavorite={() => {
                const on = toggleFavorite(id);
                toast.show(on ? tr('{name} added to your favorites', { name: profile.name }) : tr('{name} removed from favorites', { name: profile.name }));
              }}
              onBlock={() => setConfirm('block')}
              onReport={() => setReporting(true)}
              onShare={share}
            />
            <Pressable
              onPress={() => setConfirm('unmatch')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.unmatch, { borderColor: colors.danger, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="heart-dislike-outline" size={20} color={colors.danger} />
              <AppText variant="body" weight="semibold" color={colors.danger}>
                {tr('Unmatch {name}', { name: profile.name })}
              </AppText>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}

      {/* ---------- overlays ---------- */}
      <ChatOptions
        profile={optionsOpen ? profile : null}
        onClose={() => setOptionsOpen(false)}
        onAudio={() => {
          setOptionsOpen(false);
          setCall('audio');
        }}
        onVideo={() => {
          setOptionsOpen(false);
          setCall('video');
        }}
        onShare={share}
        onSearch={() => {
          setOptionsOpen(false);
          setTab('chat');
          setSearch('');
        }}
        onExport={exportChat}
        onUnmatch={() => {
          setOptionsOpen(false);
          setConfirm('unmatch');
        }}
        onBlock={() => {
          setOptionsOpen(false);
          setConfirm('block');
        }}
        onReport={() => {
          setOptionsOpen(false);
          setReporting(true);
        }}
      />

      <CallModal profile={call ? profile : null} kind={call} onClose={() => setCall(null)} />

      <ConfirmModal
        visible={confirm !== null}
        icon={confirm === 'block' ? 'ban-outline' : 'heart-dislike-outline'}
        title={confirm === 'block' ? tr('Block {name}?', { name: profile.name }) : tr('Unmatch {name}?', { name: profile.name })}
        message={
          confirm === 'block'
            ? him
              ? tr('{name} won’t see you again and this chat will be deleted. He won’t be told.', { name: profile.name })
              : tr('{name} won’t see you again and this chat will be deleted. She won’t be told.', { name: profile.name })
            : tr('You’ll disappear from each other’s matches and this chat will be deleted.')
        }
        confirmLabel={confirm === 'block' ? tr('Block') : tr('Unmatch')}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const what = confirm;
          setConfirm(null);
          if (what === 'block') leave('block', tr('{name} is blocked', { name: profile.name }));
          else leave('unmatch', tr('You unmatched {name}', { name: profile.name }));
        }}
      />

      <ReportSheet
        profile={reporting ? profile : null}
        onClose={() => setReporting(false)}
        onReport={(reason) => {
          setReporting(false);
          leave(`report: ${reason}`, tr('Thanks. {name} was reported and blocked.', { name: profile.name }));
        }}
      />

      <FullMedia media={fullMedia} onClose={() => setFullMedia(null)} />

      <PhotoPreview
        media={preview}
        onCancel={() => setPreview(null)}
        onSend={(m) => {
          setPreview(null);
          sendMedia(id, m);
        }}
      />

      <MediaViewer
        profile={viewing}
        onClose={() => setViewing(null)}
        onReport={() => {
          setViewing(null);
          setReporting(true);
        }}
      />
    </View>
  );
}

function HeaderIcon({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={23} color={colors.text} />
    </Pressable>
  );
}

// Chat | Profile switch: the pink line slides under the chosen one (CSS-like ease).
function Switch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const colors = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(tab === 'chat' ? 0 : 1);

  useEffect(() => {
    x.set(withTiming(tab === 'chat' ? 0 : 1, { duration: 240, easing: EASE }));
  }, [tab, x]);

  const lineStyle = useAnimatedStyle(() => ({ width: w / 2, transform: [{ translateX: (x.get() * w) / 2 }] }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View style={[styles.switch, { borderBottomColor: colors.border }]} onLayout={onLayout}>
      {(['chat', 'profile'] as Tab[]).map((t) => (
        <Pressable key={t} onPress={() => onChange(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} style={styles.switchBtn}>
          <AppText variant="body" weight="semibold" color={tab === t ? colors.primary : colors.textMuted}>
            {t === 'chat' ? tr('Chat') : tr('Profile')}
          </AppText>
        </Pressable>
      ))}
      <Animated.View style={[styles.switchLine, { backgroundColor: colors.primary }, lineStyle]} />
    </View>
  );
}

function InputIcon({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.inputIcon, { opacity: pressed ? 0.55 : 1 }]}
    >
      <Ionicons name={icon} size={25} color={colors.primary} />
    </Pressable>
  );
}

function Bubble({
  msg,
  newer,
  onOpenMedia,
  onHeart,
}: {
  msg: ChatMessage;
  newer?: ChatMessage;
  onOpenMedia: (m: ChatMessage) => void;
  onHeart: (m: ChatMessage) => void;
}) {
  if (msg.from === 'system') return <SystemLine text={tr(msg.text)} />;
  return <MessageBubble msg={msg} newer={newer} onOpenMedia={onOpenMedia} onHeart={onHeart} />;
}

function SystemLine({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.system}>
      <AppText variant="caption" weight="medium" muted align="center">
        {text}
      </AppText>
    </Animated.View>
  );
}

// Long-press one of THEIR messages → ❤️ (long-press again removes it).
// The heart fades in and grows from 60 % with a CSS-like ease-out (no overshoot); the time under the
// bubble moves down with the same ease, so nothing jumps.
function MessageBubble({
  msg,
  newer,
  onOpenMedia,
  onHeart,
}: {
  msg: ChatMessage;
  newer?: ChatMessage;
  onOpenMedia: (m: ChatMessage) => void;
  onHeart: (m: ChatMessage) => void;
}) {
  const colors = useTheme();
  const mine = msg.from === 'me';
  const pop = useSharedValue(msg.heart ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    pop.set(
      msg.heart
        ? withTiming(1, { duration: 260, easing: EASE_OUT })
        : withTiming(0, { duration: 200, easing: EASE_IN_OUT }),
    );
  }, [msg.heart, pop]);

  const heartStyle = useAnimatedStyle(() => ({ opacity: pop.get(), transform: [{ scale: 0.6 + pop.get() * 0.4 }] }));
  const timeStyle = useAnimatedStyle(() => ({ marginTop: 3 + pop.get() * 7 }));
  const roomStyle = useAnimatedStyle(() => ({ height: pop.get() * 8 })); // room for the heart under a bubble without a time
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.get() * 0.03 }] }));

  const longPress = mine ? undefined : () => onHeart(msg);
  const pressIn = () => press.set(withTiming(1, { duration: 180, easing: EASE_OUT }));
  const pressOut = () => press.set(withTiming(0, { duration: 240, easing: EASE }));

  // the time shows under the last bubble of a group (same sender, within 5 minutes)
  const lastOfGroup = !newer || newer.from !== msg.from || newer.at - msg.at > 5 * 60_000;
  const media = msg.media;

  return (
    <Animated.View entering={FadeIn.duration(220).easing(EASE_OUT)} style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      <Animated.View style={bodyStyle}>
        {media ? (
          media.timer ? (
            <TimedPhotoBubble media={media} mine={mine} onOpen={() => onOpenMedia(msg)} onLongPress={longPress} />
          ) : media.kind === 'photo' ? (
            <PhotoBubble media={media} onOpen={() => onOpenMedia(msg)} onLongPress={longPress} />
          ) : media.kind === 'video' ? (
            <VideoBubble media={media} onOpen={() => onOpenMedia(msg)} onLongPress={longPress} />
          ) : (
            <Pressable onLongPress={longPress} delayLongPress={300}>
              <AudioBubble media={media} mine={mine} />
            </Pressable>
          )
        ) : (
          <Pressable
            onLongPress={longPress}
            onPressIn={mine ? undefined : pressIn}
            onPressOut={mine ? undefined : pressOut}
            delayLongPress={300}
            accessibilityHint={mine ? undefined : 'Long-press to like'}
            style={[
              styles.bubble,
              mine
                ? { backgroundColor: colors.primary, borderBottomRightRadius: lastOfGroup ? 6 : 20 }
                : { backgroundColor: colors.surface, borderBottomLeftRadius: lastOfGroup ? 6 : 20 },
            ]}
          >
            <AppText variant="body" color={mine ? colors.onPrimary : colors.text}>
              {msg.text}
            </AppText>
          </Pressable>
        )}
        <Animated.View
          style={[
            styles.heartBadge,
            mine ? styles.heartLeft : styles.heartRight,
            { backgroundColor: colors.card, borderColor: colors.bg },
            heartStyle,
          ]}
        >
          <Ionicons name="heart" size={13} color={colors.primary} />
        </Animated.View>
      </Animated.View>
      {lastOfGroup ? (
        <Animated.View style={timeStyle}>
          <AppText variant="caption" color={colors.textSubtle} style={styles.time}>
            {chatTime(msg.at)}
          </AppText>
        </Animated.View>
      ) : (
        <Animated.View style={roomStyle} />
      )}
    </Animated.View>
  );
}

// Three dots that rise and fall softly, one after the other.
function TypingBubble() {
  const colors = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.bubbleWrap, styles.left]}>
      <View style={[styles.bubble, styles.typing, { backgroundColor: colors.surface }]}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 160} />
        ))}
      </View>
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const colors = useTheme();
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(
      withDelay(
        delay,
        withRepeat(withSequence(withTiming(1, { duration: 320, easing: EASE }), withTiming(0, { duration: 320, easing: EASE })), -1),
      ),
    );
  }, [v, delay]);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + v.get() * 0.65, transform: [{ translateY: -3 * v.get() }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: colors.textMuted }, style]} />;
}

// Grows softly when there is something to send.
function SendButton({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  const colors = useTheme();
  const on = useSharedValue(enabled ? 1 : 0);
  useEffect(() => {
    on.set(withTiming(enabled ? 1 : 0, { duration: 180, easing: EASE }));
  }, [enabled, on]);
  const style = useAnimatedStyle(() => ({ opacity: 0.4 + on.get() * 0.6, transform: [{ scale: 0.9 + on.get() * 0.1 }] }));
  return (
    <Pressable onPress={onPress} disabled={!enabled} accessibilityRole="button" accessibilityLabel="Send">
      <Animated.View style={[styles.send, { backgroundColor: colors.primary }, style]}>
        <Ionicons name="send" size={20} color={colors.onPrimary} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWho: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    minHeight: 40,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 6,
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  switch: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switchBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
  },
  switchLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    borderRadius: 2,
  },
  lockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  requestBtn: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  messages: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  matchNote: {
    paddingVertical: 16,
  },
  system: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: '85%',
  },
  bubbleWrap: {
    maxWidth: '80%',
    marginVertical: 1,
  },
  left: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heartBadge: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  heartRight: {
    right: -6,
  },
  heartLeft: {
    left: -6,
  },
  time: {
    marginHorizontal: 6,
    marginBottom: 6,
  },
  typing: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputIcon: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingVertical: 10,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    paddingTop: 12,
    gap: 0,
  },
  unmatch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginTop: 4,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
  },
});
