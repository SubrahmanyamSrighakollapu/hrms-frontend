import dynamic from "next/dynamic";
import {
  LayoutDashboard, User, CalendarDays, Leaf, Clock, RotateCcw, Timer, Gift, Home,
  Fingerprint, Wallet, Users, MessageSquare, BarChart3, Building2, Layers, Network,
  Settings, Search, Bell, ChevronDown, ChevronRight, Menu, X, LogOut, Eye, EyeOff,
  Plus, Download, Filter, MoreVertical, Check, XCircle, Clock3, Send, Bot, Paperclip,
  ArrowUpRight, ArrowDownRight, TrendingUp, Briefcase, Calendar, MapPin, Phone, Mail,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const map: Record<string, ComponentType<LucideProps>> = {
  LayoutDashboard, User, CalendarDays, Leaf, Clock, RotateCcw, Timer, Gift, Home,
  Fingerprint, Wallet, Users, MessageSquare, BarChart3, Building2, Layers, Network,
  Settings, Search, Bell, ChevronDown, ChevronRight, Menu, X, LogOut, Eye, EyeOff,
  Plus, Download, Filter, MoreVertical, Check, XCircle, Clock3, Send, Bot, Paperclip,
  ArrowUpRight, ArrowDownRight, TrendingUp, Briefcase, Calendar, MapPin, Phone, Mail,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = map[name] ?? LayoutDashboard;
  return <Cmp {...props} />;
}
