/**
 * Resume Tab - Resume Management & Application Tracking
 * Manage multiple resume versions and track where they were sent
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Briefcase,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
} from 'lucide-react';
import type { Resume, ResumeApplication, ResumeStats, ApplicationStatus } from '../../types/resume';
import {
  getResumes,
  addResume,
  deleteResume,
  updateResume,
  getResumeApplications,
  addResumeApplication,
  updateApplicationStatus,
  deleteResumeApplication,
  getResumeStats,
} from '../../utils/storage';

interface ResumeTabProps {
  panelWidth?: number;
}

type SubTab = 'resumes' | 'applications';

export function ResumeTab({ panelWidth = 400 }: ResumeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('resumes');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<ResumeApplication[]>([]);
  const [stats, setStats] = useState<ResumeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resumesData, applicationsData, statsData] = await Promise.all([
        getResumes(),
        getResumeApplications(),
        getResumeStats(),
      ]);

      setResumes(resumesData);
      setApplications(applicationsData);
      setStats(statsData);
    } catch (error) {
      console.error('[Uproot] Error loading resume data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCompact = panelWidth < 400;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6e6e73',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <RefreshCw size={32} className="animate-spin" strokeWidth={2} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading resumes...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header with Stats */}
      <div
        style={{
          padding: isCompact ? '16px' : '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <h2
          style={{
            fontSize: isCompact ? '18px' : '20px',
            fontWeight: '700',
            margin: '0 0 12px 0',
            color: '#1d1d1f',
          }}
        >
          Resumes & Applications
        </h2>

        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: '8px',
          }}
        >
          <StatCard
            icon={<FileText size={16} />}
            label="Resumes"
            value={stats?.totalResumes || 0}
            color="#0077B5"
          />
          <StatCard
            icon={<Briefcase size={16} />}
            label="Applications"
            value={stats?.totalApplications || 0}
            color="#FF9500"
          />
          {!isCompact && (
            <StatCard
              icon={<TrendingUp size={16} />}
              label="Interviews"
              value={stats?.applicationsByStatus.interview || 0}
              color="#34C759"
            />
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: '#FAFAFA',
        }}
      >
        <SubTabButton
          label="My Resumes"
          icon={<FileText size={14} />}
          isActive={activeSubTab === 'resumes'}
          onClick={() => setActiveSubTab('resumes')}
          count={resumes.length}
        />
        <SubTabButton
          label="Applications"
          icon={<Briefcase size={14} />}
          isActive={activeSubTab === 'applications'}
          onClick={() => setActiveSubTab('applications')}
          count={applications.length}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
        {activeSubTab === 'resumes' ? (
          <ResumesView
            resumes={resumes}
            onReload={loadData}
            panelWidth={panelWidth}
          />
        ) : (
          <ApplicationsView
            applications={applications}
            resumes={resumes}
            onReload={loadData}
            panelWidth={panelWidth}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1d1d1f' }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#6e6e73' }}>{label}</div>
      </div>
    </div>
  );
}

function SubTabButton({
  label,
  icon,
  isActive,
  onClick,
  count,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
        borderBottom: isActive ? '2px solid #0077B5' : '2px solid transparent',
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: isActive ? '600' : '500',
        color: isActive ? '#0077B5' : '#6e6e73',
        transition: 'all 150ms',
      }}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            padding: '2px 6px',
            backgroundColor: isActive ? 'rgba(0, 119, 181, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: '600',
            color: isActive ? '#0077B5' : '#6e6e73',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// RESUMES VIEW
// ============================================================================

function ResumesView({
  resumes,
  onReload,
  panelWidth,
}: {
  resumes: Resume[];
  onReload: () => void;
  panelWidth: number;
}) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleUpload = async (file: File, name: string, description: string) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const fileData = e.target?.result as string;

        await addResume({
          name,
          description,
          fileData,
          fileName: file.name,
          fileType: file.name.endsWith('.pdf') ? 'pdf' : 'docx',
          fileSize: file.size,
        });

        setShowUploadDialog(false);
        onReload();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[Uproot] Error uploading resume:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this resume? This action cannot be undone.')) {
      await deleteResume(id);
      onReload();
    }
  };

  return (
    <div style={{ padding: panelWidth < 360 ? '12px' : '16px' }}>
      {/* Upload Button */}
      <button
        onClick={() => setShowUploadDialog(true)}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#0077B5',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px',
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#005885';
          e.currentTarget.style.transform = 'scale(1.01)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0077B5';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Upload size={16} />
        Upload Resume
      </button>

      {/* Resume List */}
      {resumes.length === 0 ? (
        <EmptyState type="resumes" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={() => handleDelete(resume.id)}
              panelWidth={panelWidth}
            />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <UploadDialog
          onUpload={handleUpload}
          onClose={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  );
}

function ResumeCard({
  resume,
  onDelete,
  panelWidth,
}: {
  resume: Resume;
  onDelete: () => void;
  panelWidth: number;
}) {
  const isCompact = panelWidth < 360;

  const handleDownload = () => {
    if (!resume.fileData) return;

    const link = document.createElement('a');
    link.href = resume.fileData;
    link.download = resume.fileName || `${resume.name}.${resume.fileType}`;
    link.click();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: isCompact ? '12px' : '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 119, 181, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileText size={20} color="#0077B5" />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1d1d1f',
            }}
          >
            {resume.name}
          </h4>
          {resume.description && (
            <p
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                margin: '0 0 8px 0',
              }}
            >
              {resume.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#8e8e93' }}>
            {resume.fileName && <span>{resume.fileName}</span>}
            {resume.fileSize && <span>{formatFileSize(resume.fileSize)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {resume.fileData && (
            <IconButton
              icon={<Download size={14} />}
              onClick={handleDownload}
              title="Download"
            />
          )}
          <IconButton
            icon={<Trash2 size={14} />}
            onClick={onDelete}
            title="Delete"
            color="#FF3B30"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APPLICATIONS VIEW
// ============================================================================

function ApplicationsView({
  applications,
  resumes,
  onReload,
  panelWidth,
}: {
  applications: ResumeApplication[];
  resumes: Resume[];
  onReload: () => void;
  panelWidth: number;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAdd = async (data: Omit<ResumeApplication, 'id'>) => {
    await addResumeApplication(data);
    setShowAddDialog(false);
    onReload();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this application?')) {
      await deleteResumeApplication(id);
      onReload();
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await updateApplicationStatus(id, status);
    onReload();
  };

  return (
    <div style={{ padding: panelWidth < 360 ? '12px' : '16px' }}>
      {/* Add Button */}
      <button
        onClick={() => setShowAddDialog(true)}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#0077B5',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px',
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#005885';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0077B5';
        }}
      >
        <Plus size={16} />
        Track Application
      </button>

      {/* Applications List */}
      {applications.length === 0 ? (
        <EmptyState type="applications" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              resume={resumes.find((r) => r.id === app.resumeId)}
              onDelete={() => handleDelete(app.id)}
              onStatusChange={(status) => handleStatusChange(app.id, status)}
              panelWidth={panelWidth}
            />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <AddApplicationDialog
          resumes={resumes}
          onAdd={handleAdd}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  resume,
  onDelete,
  onStatusChange,
  panelWidth,
}: {
  application: ResumeApplication;
  resume?: Resume;
  onDelete: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  panelWidth: number;
}) {
  const isCompact = panelWidth < 360;

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return <Clock size={14} color="#FF9500" />;
      case 'screening': return <FileCheck size={14} color="#0077B5" />;
      case 'interview': return <TrendingUp size={14} color="#34C759" />;
      case 'offer': return <CheckCircle2 size={14} color="#34C759" />;
      case 'rejected': return <XCircle size={14} color="#FF3B30" />;
      case 'withdrawn': return <XCircle size={14} color="#8E8E93" />;
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return '#FF9500';
      case 'screening': return '#0077B5';
      case 'interview': return '#34C759';
      case 'offer': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'withdrawn': return '#8E8E93';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: isCompact ? '12px' : '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 119, 181, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Briefcase size={20} color="#0077B5" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 2px 0',
              color: '#1d1d1f',
            }}
          >
            {application.jobTitle}
          </h4>
          <p
            style={{
              fontSize: '13px',
              color: '#6e6e73',
              margin: '0 0 6px 0',
            }}
          >
            {application.company}
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: '#8e8e93' }}>
            <Calendar size={10} />
            {formatDate(application.appliedDate)}
            {resume && (
              <>
                <span>•</span>
                <span>{resume.name}</span>
              </>
            )}
          </div>
        </div>

        <IconButton
          icon={<Trash2 size={14} />}
          onClick={onDelete}
          title="Delete"
          color="#FF3B30"
        />
      </div>

      {/* Status Buttons */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {(['applied', 'screening', 'interview', 'offer', 'rejected'] as ApplicationStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            style={{
              padding: '4px 8px',
              backgroundColor: application.status === status ? getStatusColor(status) : 'rgba(0, 0, 0, 0.05)',
              color: application.status === status ? 'white' : '#6e6e73',
              border: 'none',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'capitalize',
              transition: 'all 150ms',
            }}
          >
            {application.status === status && getStatusIcon(status)}
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function IconButton({
  icon,
  onClick,
  title,
  color = '#6e6e73',
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px',
        background: 'none',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 150ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
    </button>
  );
}

function EmptyState({ type }: { type: 'resumes' | 'applications' }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 24px',
        color: '#6e6e73',
      }}
    >
      {type === 'resumes' ? <FileText size={48} /> : <Briefcase size={48} />}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '16px 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        {type === 'resumes' ? 'No Resumes Yet' : 'No Applications Tracked'}
      </h3>
      <p style={{ fontSize: '13px', margin: 0 }}>
        {type === 'resumes'
          ? 'Upload your first resume to get started'
          : 'Start tracking your applications to stay organized'}
      </p>
    </div>
  );
}

// Placeholder dialog components (to be implemented)
function UploadDialog({
  onUpload,
  onClose,
}: {
  onUpload: (file: File, name: string, description: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = () => {
    if (file && name) {
      onUpload(file, name, description);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
          Upload Resume
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Resume Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Tech Resume"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., For software engineering roles"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            File (PDF or DOCX)
          </label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || !name}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: file && name ? '#0077B5' : 'rgba(0, 0, 0, 0.1)',
              color: file && name ? 'white' : 'rgba(0, 0, 0, 0.3)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: file && name ? 'pointer' : 'not-allowed',
            }}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function AddApplicationDialog({
  resumes,
  onAdd,
  onClose,
}: {
  resumes: Resume[];
  onAdd: (data: Omit<ResumeApplication, 'id'>) => void;
  onClose: () => void;
}) {
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  const handleSubmit = () => {
    if (company && jobTitle && resumeId) {
      onAdd({
        resumeId,
        company,
        jobTitle,
        jobUrl: jobUrl || undefined,
        appliedDate: Date.now(),
        status: 'applied',
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
          Track Application
        </h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Google"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Job Title
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Resume Used
          </label>
          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="">Select a resume...</option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Job URL (Optional)
          </label>
          <input
            type="text"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://linkedin.com/jobs/..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!company || !jobTitle || !resumeId}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: company && jobTitle && resumeId ? '#0077B5' : 'rgba(0, 0, 0, 0.1)',
              color: company && jobTitle && resumeId ? 'white' : 'rgba(0, 0, 0, 0.3)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: company && jobTitle && resumeId ? 'pointer' : 'not-allowed',
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
