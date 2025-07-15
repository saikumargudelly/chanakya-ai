import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import axios from 'axios';

const queryClient = new QueryClient();

const fetchRepoData = async () => {
  const response = await axios.get('https://api.example.com/repoData');
  return response.data;
};

const RepoData = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['repoData'], // Changed from 'repoData' to ['repoData']
    queryFn: fetchRepoData,
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      <h1>Repo Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const App = () => {
  const prefetchRouteData = async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['repoData'], // Changed from 'repoData' to ['repoData']
        queryFn: fetchRepoData,
        retry: 3,
        staleTime: 5 * 60 * 1000,
      });
    } catch (error) {
      console.error('Error prefetching data:', error);
    }
  };

  React.useEffect(() => {
    prefetchRouteData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <h1>Welcome to the Repo Data Viewer</h1>
        <RepoData />
      </div>
    </QueryClientProvider>
  );
};

export default App;