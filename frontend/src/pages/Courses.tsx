import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  Users,
  Star,
  ChevronRight,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

import { coursesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  formatDuration,
  getDifficultyColor,
  capitalize,
  debounce,
} from '@/lib/utils';

export const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch courses with filters
  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses', currentPage, searchTerm, selectedDifficulty],
    queryFn: () => coursesApi.getCourses({
      page: currentPage,
      limit: 12,
      search: searchTerm || undefined,
      difficulty: selectedDifficulty || undefined,
    }),
    keepPreviousData: true,
  });
  
  // Debounced search handler
  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };
  
  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty === selectedDifficulty ? '' : difficulty);
    setCurrentPage(1);
  };
  
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  
  if (isLoading && !coursesData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load courses
        </h3>
        <p className="text-gray-600 mb-4">
          There was an error loading the course catalog.
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Course Catalog
          </h1>
          <p className="mt-2 text-gray-600">
            Discover hands-on Docker courses and start your containerization journey.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>
            {coursesData?.total || 0} courses available
          </span>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search courses..."
            className="pl-10"
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Difficulty Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Difficulty:</span>
          {difficulties.map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleDifficultyChange(difficulty)}
            >
              {capitalize(difficulty)}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Courses Grid */}
      {coursesData?.data && coursesData.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesData.data.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`}>
                <Card hover className="h-full">
                  <div className="aspect-video bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-lg p-6 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Title and Description */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {course.shortDescription || course.description}
                        </p>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="default"
                          className={getDifficultyColor(course.difficulty)}
                        >
                          {capitalize(course.difficulty)}
                        </Badge>
                        {course.labCount && (
                          <Badge variant="info">
                            {course.labCount} labs
                          </Badge>
                        )}
                      </div>
                      
                      {/* Meta Information */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(course.estimatedDurationMinutes)}</span>
                        </div>
                        
                        {course.enrollmentCount && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollmentCount} enrolled</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Rating */}
                      {course.completionRate && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {Math.round(course.completionRate)}% completion rate
                          </span>
                        </div>
                      )}
                      
                      {/* Action */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-primary-600">
                          View Course
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Pagination */}
          {coursesData.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!coursesData.hasPrev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: coursesData.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return Math.abs(page - currentPage) <= 2 || page === 1 || page === coursesData.totalPages;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                disabled={!coursesData.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedDifficulty
              ? 'Try adjusting your search filters.'
              : 'There are no courses available at the moment.'}
          </p>
          {(searchTerm || selectedDifficulty) && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedDifficulty('');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};