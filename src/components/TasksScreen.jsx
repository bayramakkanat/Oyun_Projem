import { useState, useEffect } from "react";
import { initTasks, saveTasks, getTodayString, getWeekStart } from "../utils/helpers";

export default function TasksScreen({ onClose, userId, user, loadTasksFromDB, saveTasksToDB }) {
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const load = async () => {
    const localData = initTasks(userId);
    if (!user || !loadTasksFromDB) {
      setTaskData(localData);
      setLoading(false);
      return;
    }
    try {
      const dbData = await loadTasksFromDB();
      if (dbData) {
        // Firebase'den gelen veriyi kontrol et, günlük/haftalık sıfırlama yap
        const today = getTodayString();
        const weekStart = getWeekStart();
        if (dbData.daily?.date !== today) dbData.daily = localData.daily;
        if (dbData.weekly?.weekStart !== weekStart) dbData.weekly = localData.weekly;
        saveTasks(dbData, userId);
        setTaskData(dbData);
      } else {
        await saveTasksToDB(localData);
        setTaskData(localData);
      }
    } catch {
      setTaskData(localData);
    }
    setLoading(false);
  };
  load();
}, [loadTasksFromDB, saveTasksToDB, user, userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>;
if (!taskData) return null;

  const { daily, weekly } = taskData;

  const totalDailyDone = daily.tasks.filter(t => t.done).length;
  const totalWeeklyDone = weekly.tasks.filter(t => t.done).length;
  const totalDailyXP = daily.tasks.filter(t => t.done).reduce((s, t) => s + t.reward, 0);
  const totalWeeklyXP = weekly.tasks.filter(t => t.done).reduce((s, t) => s + t.reward, 0);

 const TaskCard = ({ task }) => (
  <div
    className={`rounded-2xl border-2 p-4 transition-all cursor-pointer ${
      task.done
        ? "bg-green-900/30 border-green-500/40"
        : "bg-gray-900/60 border-gray-700/60 hover:border-purple-500/50"
    }`}
   onClick={async () => {
  if (task.done || task.progress < task.target) return;
  const updated = { ...taskData };
  const allTasks = [
    ...updated.daily.tasks,
    ...updated.weekly.tasks,
  ];
  const t = allTasks.find(t => t.id === task.id);
  if (t) {
    t.done = true;
    saveTasks(updated, userId);
    setTaskData({ ...updated });
    if (saveTasksToDB) await saveTasksToDB(updated);
  }
}}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{task.done ? "✅" : task.progress >= task.target ? "🎁" : "⬜"}</span>
        <span className={`text-sm font-bold ${task.done ? "text-green-300" : "text-white"}`}>
          {task.label}
        </span>
      </div>
      <div className={`text-xs font-black px-2 py-1 rounded-lg whitespace-nowrap ${
        task.done ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
      }`}>
        +{task.reward} XP
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${task.done ? "bg-green-500" : "bg-purple-500"}`}
          style={{ width: `${(task.progress / task.target) * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {task.progress}/{task.target}
      </span>
    </div>
    {!task.done && task.progress >= task.target && (
      <div className="text-xs text-yellow-400 font-black mt-2 text-center animate-pulse">
        🎁 Ödülü almak için tıkla!
      </div>
    )}
  </div>
);

  return (
    <div className="min-h-screen text-white p-4" style={{
      background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)"
    }}>
      <div className="max-w-2xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-yellow-300">📅 Meydan Okumalar</h1>
            <p className="text-gray-400 text-sm mt-1">Görevleri tamamla, XP kazan!</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 transition-all font-bold"
          >
            ✕ Kapat
          </button>
        </div>

        {/* Günlük Görevler */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-white">☀️ Günlük Görevler</h2>
              <p className="text-xs text-gray-500">Her gün sıfırlanır</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-yellow-400">{totalDailyXP} XP kazanıldı</div>
              <div className="text-xs text-gray-500">{totalDailyDone}/{daily.tasks.length} tamamlandı</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {daily.tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>

        {/* Haftalık Görevler */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-white">📆 Haftalık Görevler</h2>
              <p className="text-xs text-gray-500">Her Pazartesi sıfırlanır</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-yellow-400">{totalWeeklyXP} XP kazanıldı</div>
              <div className="text-xs text-gray-500">{totalWeeklyDone}/{weekly.tasks.length} tamamlandı</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {weekly.tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
