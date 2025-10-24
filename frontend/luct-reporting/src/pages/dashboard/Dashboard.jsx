import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  CalendarCheck2,
  ClipboardList,
  UsersRound,
  Award,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import StatCard from "../../components/ui/StatCard.jsx";
import Card from "../../components/ui/Card.jsx";
import Tag from "../../components/ui/Tag.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Button from "../../components/ui/Button.jsx";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/dashboard");
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p className="loading">Loading insights...</p>;
  }

  if (error) {
    return (
      <EmptyState
        title="Dashboard offline"
        message={error}
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  if (!data) {
    return null;
  }

  const renderLecturer = () => (
    <>
      <div className="grid stats-grid">
        <StatCard
          label="Average attendance"
          value={`${data.stats.avgAttendance}%`}
          hint="Last five reports"
          icon={TrendingUp}
        />
        <StatCard
          label="Reports this month"
          value={data.stats.submittedThisMonth}
          icon={ClipboardList}
          tone="accent"
        />
        <StatCard
          label="Upcoming classes"
          value={data.stats.upcomingClasses.length}
          icon={CalendarCheck2}
          tone="violet"
        />
      </div>
      <div className="grid two">
        <Card title="Next classes" subtle>
          {data.stats.upcomingClasses.length ? (
            <ul className="list">
              {data.stats.upcomingClasses.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.classCode}</strong>
                    <span>{item.schedule}</span>
                  </div>
                  <Tag tone="violet">Semester {item.semester}</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No classes scheduled"
              message="You are all caught up."
            />
          )}
        </Card>
        <Card title="Recent reports">
          {data.reports.length ? (
            <ul className="list compact">
              {data.reports.slice(0, 4).map((report) => (
                <li key={report.id}>
                  <div>
                    <strong>{report.course?.name}</strong>
                    <span>
                      {format(new Date(report.dateOfLecture), "dd MMM")}
                    </span>
                  </div>
                  <Tag tone="accent">
                    {report.attendancePercentage ??
                      report.actualStudentsPresent}
                    % attendance
                  </Tag>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No submissions"
              message="Submit your first teaching report to populate analytics."
            />
          )}
        </Card>
      </div>
    </>
  );

  const renderPrincipalLecturer = () => (
    <>
      <div className="grid stats-grid">
        <StatCard
          label="Active monitoring"
          value={data.monitoring.length}
          icon={Clock}
        />
        <StatCard
          label="Avg experience rating"
          value={data.stats.avgEngagement}
          tone="accent"
          icon={Award}
        />
        <StatCard
          label="Follow ups"
          value={data.stats.outstandingFollowUps}
          tone="violet"
          icon={CalendarCheck2}
        />
      </div>
      <div className="grid two">
        <Card title="Latest monitoring notes">
          {data.monitoring.length ? (
            <ul className="timeline">
              {data.monitoring.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <div className="timeline-dot" />
                  <div>
                    <strong>
                      {item.report?.courseName || "Monitoring note"}
                    </strong>
                    {item.findings && <p>{item.findings}</p>}
                    <small>
                      {(() => {
                        const dateSource =
                          item.report?.dateOfLecture || item.createdAt;
                        return dateSource
                          ? format(new Date(dateSource), "dd MMM")
                          : "";
                      })()}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No monitoring entries"
              message="Capture a class observation to track improvements."
            />
          )}
        </Card>
        <Card title="Experience ratings" subtle>
          {data.ratings.length ? (
            <ul className="list compact">
              {data.ratings.slice(0, 4).map((rating) => (
                <li key={rating.id}>
                  <div>
                    <strong>{rating.report?.courseName || "Course"}</strong>
                    <span>{rating.comments}</span>
                  </div>
                  <Tag tone="accent">{rating.rating}/5</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Awaiting ratings"
              message="Student feedback will appear once submitted."
            />
          )}
        </Card>
      </div>
    </>
  );

  const renderProgramLeader = () => (
    <>
      <div className="grid stats-grid">
        <StatCard
          label="Lecturers active"
          value={data.stats.activeLecturers}
          icon={UsersRound}
        />
        <StatCard
          label="Reports submitted"
          value={data.stats.reportsSubmitted}
          tone="accent"
          icon={ClipboardList}
        />
        <StatCard
          label="Announcements"
          value={data.announcements.length}
          tone="violet"
          icon={CalendarCheck2}
        />
      </div>
      <div className="grid two">
        <Card title="Programmes" subtle>
          <ul className="list">
            {data.programs.map((program) => (
              <li key={program.id}>
                <div>
                  <strong>{program.name}</strong>
                  <span>{program.level}</span>
                </div>
                <Tag tone="violet">{program.durationYears} years</Tag>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Faculty announcements">
          {data.announcements.length ? (
            <ul className="list">
              {data.announcements.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No announcements"
              message="Stay tuned for updates."
            />
          )}
        </Card>
      </div>
    </>
  );

  const renderStudent = () => (
    <>
      <div className="grid stats-grid">
        <StatCard
          label="Classes"
          value={data.stats.classesCount}
          icon={GraduationCap}
        />
        <StatCard
          label="Avg cohort attendance"
          value={`${data.stats.avgAttendance || 0}%`}
          tone="accent"
          icon={TrendingUp}
        />
        <StatCard
          label="Learning events"
          value={data.announcements.length}
          tone="violet"
          icon={CalendarCheck2}
        />
      </div>
      <div className="grid two">
        <Card title="Your classes">
          {data.classes.length ? (
            <ul className="list">
              {data.classes.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.classCode}</strong>
                    <span>{item.course?.name}</span>
                  </div>
                  <Tag tone="violet">Semester {item.semester}</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No enrolments"
              message="Once enrolled, your schedule will appear here."
            />
          )}
        </Card>
        <Card title="Announcements" subtle>
          {data.announcements.length ? (
            <ul className="list">
              {data.announcements.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="All clear" message="No new announcements." />
          )}
        </Card>
      </div>
    </>
  );

  return (
    <div className="dashboard">
      {user.role === "lecturer" && renderLecturer()}
      {user.role === "principal_lecturer" && renderPrincipalLecturer()}
      {user.role === "program_leader" && renderProgramLeader()}
      {user.role === "student" && renderStudent()}
      {user.role === "admin" && (
        <EmptyState
          title="Admin Workspace"
          message="Access the full admin control panel to manage all system resources."
          action={
            <Button onClick={() => navigate("/admin")}>
              Go to Admin Workspace
            </Button>
          }
        />
      )}
    </div>
  );
};

export default Dashboard;
