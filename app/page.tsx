'use client'

import { useState, useEffect } from 'react'
import type { Todo } from '@/types/todo'

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos')
      const data = await response.json()
      if (data.todos) {
        setTodos(data.todos)
      }
    } catch (err) {
      setError('Failed to load todos')
      console.error(err)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo })
      })

      const data = await response.json()

      if (response.ok && data.todo) {
        setTodos([data.todo, ...todos])
        setNewTodo('')
      } else {
        setError(data.error || 'Failed to add todo')
      }
    } catch (err) {
      setError('Failed to add todo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed })
      })

      const data = await response.json()

      if (response.ok && data.todo) {
        setTodos(todos.map(t => t.id === id ? data.todo : t))
      }
    } catch (err) {
      console.error('Failed to update todo:', err)
    }
  }

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditText(currentTitle)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return

    try {
      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: editText.trim() })
      })

      const data = await response.json()

      if (response.ok && data.todo) {
        setTodos(todos.map(t => t.id === id ? data.todo : t))
        setEditingId(null)
        setEditText('')
      }
    } catch (err) {
      console.error('Failed to edit todo:', err)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTodos(todos.filter(t => t.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete todo:', err)
    }
  }

  const completedCount = todos.filter(t => t.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            📝 Todo List
          </h1>
          <p className="text-gray-300 text-center mb-8">
            {completedCount} of {totalCount} completed
          </p>

          <form onSubmit={addTodo} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newTodo.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '...' : 'Add'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg border border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {todos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No todos yet!</p>
                <p className="text-sm mt-2">Add your first task above</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors group border border-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 text-purple-500 bg-gray-600 border-gray-500 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                  />
                  
                  {editingId === todo.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1 bg-gray-600 border border-purple-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`flex-1 ${
                          todo.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-100'
                        }`}
                      >
                        {todo.title}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(todo.id, todo.title)}
                          className="text-blue-400 hover:text-blue-300 text-lg"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="text-red-400 hover:text-red-300 text-lg"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Powered by Next.js + Supabase 🚀</p>
        </div>
      </div>
    </div>
  )
}