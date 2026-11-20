import {
  LayoutDashboard, User, CalendarDays, Leaf, Clock, RotateCcw, Timer, Gift, Home,
  Fingerprint, Wallet, Users, MessageSquare, BarChart3, Building2, Layers, Network,
  Settings, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, Menu, X, LogOut,
  Eye, EyeOff, Plus, Download, Filter, MoreVertical, MoreHorizontal, Check, CheckCircle2,
  XCircle, Clock3, Send, Bot, Paperclip, Sparkles, Command, Activity, ShieldCheck,
  ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Briefcase,
  Calendar, MapPin, Phone, Mail, Hexagon, Flame, Zap, Star, Play, PanelLeft,
  AlertCircle, Pencil, KeyRound, Copy, RefreshCw, Save, Trash2, UserCheck, UserX, Hash, Info,
  UserPlus, Lock, ShieldHalf, CircleHelp,
  Smile, Pin, PinOff, Image, FileText, File, Reply, Forward, Archive, BellOff, LoaderCircle,
  Crown, CheckCheck, Volume2, VolumeX, ExternalLink, MessageSquarePlus, AtSign, Upload, UserMinus,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const map = {
  LayoutDashboard, User, CalendarDays, Leaf, Clock, RotateCcw, Timer, Gift, Home,
  Fingerprint, Wallet, Users, MessageSquare, BarChart3, Building2, Layers, Network,
  Settings, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, Menu, X, LogOut,
  Eye, EyeOff, Plus, Download, Filter, MoreVertical, MoreHorizontal, Check, CheckCircle2,
  XCircle, Clock3, Send, Bot, Paperclip, Sparkles, Command, Activity, ShieldCheck,
  ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Briefcase,
  Calendar, MapPin, Phone, Mail, Hexagon, Flame, Zap, Star, Play, PanelLeft,
  AlertCircle, Pencil, KeyRound, Copy, RefreshCw, Save, Trash2, UserCheck, UserX, Hash, Info,
  UserPlus, Lock, ShieldHalf,
  CircleHelp,
  Smile, Pin, PinOff, Image, FileText, File, Reply, Forward, Archive, BellOff, LoaderCircle,
  Crown, CheckCheck, Volume2, VolumeX, ExternalLink, MessageSquarePlus, AtSign, Upload, UserMinus,
} satisfies Record<string, ComponentType<LucideProps>>;

export type IconName = keyof typeof map;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = map[name as IconName];
  if (!Cmp) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Unknown HRMS icon "${name}". Add its Lucide component to Icon.tsx.`);
    }
    return <CircleHelp {...props} />;
  }
  return <Cmp {...props} />;
}
