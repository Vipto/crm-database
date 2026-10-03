import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Terminal, FileCode } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions for Role-Based Access Control (RBAC)
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function hasRole(role) {
      return isAuthenticated() && (
        getUserData().role == role ||
        request.auth.token.role == role
      );
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isManager() {
      return hasRole('manager') || isAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || (isAuthenticated() && request.auth.uid == userId);
    }
    
    // Sellers collection
    match /sellers/{sellerId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        isAdmin() || 
        isManager() || 
        resource.data.assignedEmployeeId == request.auth.uid ||
        resource.data.createdBy == request.auth.uid
      );
      allow delete: if isAdmin();
    }
    
    // Employees collection
    match /employees/{employeeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        isAdmin() || 
        isManager() || 
        resource.data.assignedEmployeeId == request.auth.uid
      );
      allow delete: if isAdmin() || isManager();
    }
    
    // Activities audit trail (Append-only for accountability)
    match /activities/{activityId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immutable audit log
    }
  }
}`;

const FIRESTORE_INDEXES_TEXT = `{
  "indexes": [
    {
      "collectionGroup": "sellers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedEmployeeId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sellers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sellerStatus", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sellers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "city", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sellers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "searchKeywords", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedEmployeeId", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ]
}`;

export const SecurityRulesViewer: React.FC = () => {
  const { success } = useToast();
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedIndexes, setCopiedIndexes] = useState(false);

  const copyText = (text: string, isRules: boolean) => {
    navigator.clipboard.writeText(text);
    if (isRules) {
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2000);
    } else {
      setCopiedIndexes(true);
      setTimeout(() => setCopiedIndexes(false), 2000);
    }
    success('Copied to Clipboard', 'Configuration snippet ready to paste.');
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Firestore Security Rules Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Cloud Firestore Security Rules</h4>
          </div>
          <button
            onClick={() => copyText(FIRESTORE_RULES_TEXT, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
          >
            {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRules ? 'Copied!' : 'Copy rules'}</span>
          </button>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed">
          Enforces server-side authorization: Admins have full access; Managers can assign & oversee teams; Employees can modify assigned records; Audit activities are immutable.
        </p>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
          {FIRESTORE_RULES_TEXT}
        </pre>
      </div>

      {/* Firestore Indexes JSON */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-vipto-400" />
            <h4 className="text-sm font-semibold text-white">Compound Firestore Indexes (firestore.indexes.json)</h4>
          </div>
          <button
            onClick={() => copyText(FIRESTORE_INDEXES_TEXT, false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
          >
            {copiedIndexes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndexes ? 'Copied!' : 'Copy indexes'}</span>
          </button>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed">
          Enables blazing-fast compound filtering and cursor-based pagination for 100,000+ seller collections.
        </p>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
          {FIRESTORE_INDEXES_TEXT}
        </pre>
      </div>
    </div>
  );
};
