import {
  LayoutDashboard, User, CalendarDays, Leaf, Clock, RotateCcw, Timer, Gift, Home,
  Fingerprint, Wallet, Users, MessageSquare, BarChart3, Building2, Layers, Network,
  Settings, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, Menu, X, LogOut,
  Eye, EyeOff, Plus, Download, Filter, MoreVertical, MoreHorizontal, Check, CheckCircle2,
  XCircle, Clock3, Send, Bot, Paperclip, Sparkles, Command, Activity, ShieldCheck,
  ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Briefcase,
  Calendar, MapPin, Phone, Mail, Hexagon, Flame, Zap, Star, Play, PanelLeft,
  AlertCircle, Pencil, KeyRound, Copy, RefreshCw, Save, Trash2, UserCheck, UserX, Hash, Info,
  UserPlus, Lock, ShieldHalf,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const map: Record<string, ComponentType<LucideProps>> = {
  LayoutDashboard, User, CalendarDays, Leaf, Clock, RotateCcw, Timer, Gift, Home,
  Fingerprint, Wallet, Users, MessageSquare, BarChart3, Building2, Layers, Network,
  Settings, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, Menu, X, LogOut,
  Eye, EyeOff, Plus, Download, Filter, MoreVertical, MoreHorizontal, Check, CheckCircle2,
  XCircle, Clock3, Send, Bot, Paperclip, Sparkles, Command, Activity, ShieldCheck,
  ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Briefcase,
  Calendar, MapPin, Phone, Mail, Hexagon, Flame, Zap, Star, Play, PanelLeft,
  AlertCircle, Pencil, KeyRound, Copy, RefreshCw, Save, Trash2, UserCheck, UserX, Hash, Info,
  UserPlus, Lock, ShieldHalf,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = map[name] ?? LayoutDashboard;
  return <Cmp {...props} />;
}
